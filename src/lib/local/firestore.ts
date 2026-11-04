import {
  Timestamp,
  comparable,
  deserialize,
  loadStore,
  newId,
  notifyStore,
  persistStore,
  resolveSentinels,
  serialize,
  subscribeStore,
} from './shared';

export { Timestamp };

export function serverTimestamp() {
  return { _methodName: 'serverTimestamp' as const };
}

type WhereOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains';

interface WhereConstraint {
  type: 'where';
  field: string;
  op: WhereOp;
  value: unknown;
}

interface OrConstraint {
  type: 'or';
  constraints: WhereConstraint[];
}

interface OrderConstraint {
  type: 'orderBy';
  field: string;
  direction: 'asc' | 'desc';
}

type Constraint = WhereConstraint | OrConstraint | OrderConstraint;

export interface CollectionRef {
  type: 'collection';
  path: string;
}

export interface DocRef {
  type: 'doc';
  path: string;
  id: string;
}

export interface QueryRef {
  type: 'query';
  path: string;
  constraints: Constraint[];
}

function fieldValue(data: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') return (current as Record<string, unknown>)[key];
    return undefined;
  }, data);
}

function matchesWhere(data: Record<string, unknown>, constraint: WhereConstraint): boolean {
  const left = fieldValue(data, constraint.field);
  const right = constraint.value;
  if (constraint.op === '==') return comparable(left) === comparable(right) && left !== undefined && right !== undefined
    ? comparable(left) === comparable(right)
    : left === right;
  if (constraint.op === '!=') return left !== right;
  if (constraint.op === 'array-contains') return Array.isArray(left) && left.some((item) => comparable(item) === comparable(right));
  const l = comparable(left);
  const r = comparable(right);
  if (constraint.op === '<') return l < r;
  if (constraint.op === '<=') return l <= r;
  if (constraint.op === '>') return l > r;
  if (constraint.op === '>=') return l >= r;
  return false;
}

function matches(data: Record<string, unknown>, constraints: Constraint[]): boolean {
  return constraints.every((constraint) => {
    if (constraint.type === 'orderBy') return true;
    if (constraint.type === 'or') return constraint.constraints.some((item) => matchesWhere(data, item));
    return matchesWhere(data, constraint);
  });
}

function docsInCollection(path: string): Array<{ id: string; path: string; data: Record<string, unknown> }> {
  const store = loadStore();
  const prefix = path ? `${path}/` : '';
  return Object.entries(store.docs)
    .filter(([docPath]) => docPath.startsWith(prefix) && !docPath.slice(prefix.length).includes('/'))
    .map(([docPath, raw]) => ({
      id: docPath.slice(prefix.length),
      path: docPath,
      data: (deserialize(raw) || {}) as Record<string, unknown>,
    }));
}

function applyQuery(path: string, constraints: Constraint[]) {
  let rows = docsInCollection(path).filter((row) => matches(row.data, constraints));
  const ordering = constraints.find((constraint): constraint is OrderConstraint => constraint.type === 'orderBy');
  if (ordering) {
    rows = [...rows].sort((a, b) => {
      const av = comparable(fieldValue(a.data, ordering.field));
      const bv = comparable(fieldValue(b.data, ordering.field));
      if (av < bv) return ordering.direction === 'desc' ? 1 : -1;
      if (av > bv) return ordering.direction === 'desc' ? -1 : 1;
      return 0;
    });
  }
  return rows;
}

function docSnapshot(path: string) {
  const id = path.split('/').pop() || path;
  const raw = loadStore().docs[path];
  const exists = raw !== undefined;
  return {
    id,
    ref: { type: 'doc', path, id } as DocRef,
    exists: () => exists,
    data: () => (exists ? (deserialize(raw) as Record<string, unknown>) : undefined),
  };
}

function querySnapshot(path: string, constraints: Constraint[]) {
  const rows = applyQuery(path, constraints);
  const docs = rows.map((row) => ({
    id: row.id,
    ref: { type: 'doc', path: row.path, id: row.id } as DocRef,
    data: () => ({ ...row.data }),
  }));
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (fn: (doc: (typeof docs)[number]) => void) => docs.forEach(fn),
  };
}

export function collection(_db: unknown, ...segments: string[]): CollectionRef {
  return { type: 'collection', path: segments.join('/') };
}

export function doc(parent: unknown, ...segments: string[]): DocRef {
  if (parent && typeof parent === 'object' && (parent as CollectionRef).type === 'collection') {
    const collectionRef = parent as CollectionRef;
    const id = segments[0] || newId();
    return { type: 'doc', path: `${collectionRef.path}/${id}`, id };
  }
  if (parent && typeof parent === 'object' && (parent as DocRef).type === 'doc') {
    const path = [(parent as DocRef).path, ...segments].join('/');
    return { type: 'doc', path, id: segments[segments.length - 1] || path.split('/').pop() || path };
  }
  const path = segments.join('/');
  return { type: 'doc', path, id: segments[segments.length - 1] };
}

export function where(field: string, op: WhereOp, value: unknown): WhereConstraint {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): OrderConstraint {
  return { type: 'orderBy', field, direction };
}

export function or(...constraints: WhereConstraint[]): OrConstraint {
  return { type: 'or', constraints };
}

export function query(ref: CollectionRef | QueryRef, ...constraints: Constraint[]): QueryRef {
  const previous = ref.type === 'query' ? ref.constraints : [];
  return { type: 'query', path: ref.path, constraints: [...previous, ...constraints] };
}

export async function getDocs(ref: CollectionRef | QueryRef) {
  const constraints = ref.type === 'query' ? ref.constraints : [];
  return querySnapshot(ref.path, constraints);
}

export async function getDoc(ref: DocRef) {
  return docSnapshot(ref.path);
}

export async function addDoc(ref: CollectionRef, data: Record<string, unknown>) {
  const id = newId();
  const path = `${ref.path}/${id}`;
  const store = loadStore();
  store.docs[path] = serialize(resolveSentinels(data));
  persistStore();
  notifyStore();
  return { id, path };
}

export async function setDoc(ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) {
  const store = loadStore();
  const resolved = resolveSentinels(data) as Record<string, unknown>;
  if (options?.merge && store.docs[ref.path]) {
    const prev = (deserialize(store.docs[ref.path]) || {}) as Record<string, unknown>;
    store.docs[ref.path] = serialize({ ...prev, ...resolved });
  } else {
    store.docs[ref.path] = serialize(resolved);
  }
  persistStore();
  notifyStore();
}

export async function updateDoc(ref: DocRef, data: Record<string, unknown>) {
  const store = loadStore();
  if (!store.docs[ref.path]) {
    const error = new Error('No document to update') as Error & { code?: string };
    error.code = 'not-found';
    throw error;
  }
  const prev = (deserialize(store.docs[ref.path]) || {}) as Record<string, unknown>;
  const resolved = resolveSentinels(data) as Record<string, unknown>;
  store.docs[ref.path] = serialize({ ...prev, ...resolved });
  persistStore();
  notifyStore();
}

export async function deleteDoc(ref: DocRef) {
  const store = loadStore();
  delete store.docs[ref.path];
  persistStore();
  notifyStore();
}

export function writeBatch(_db: unknown) {
  const operations: Array<() => Promise<void>> = [];
  return {
    set(ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) {
      operations.push(() => setDoc(ref, data, options));
    },
    update(ref: DocRef, data: Record<string, unknown>) {
      operations.push(() => updateDoc(ref, data));
    },
    delete(ref: DocRef) {
      operations.push(() => deleteDoc(ref));
    },
    async commit() {
      for (const operation of operations) {
        await operation();
      }
    },
  };
}

export function onSnapshot(
  ref: CollectionRef | QueryRef | DocRef,
  onNext: (snapshot: ReturnType<typeof querySnapshot> | ReturnType<typeof docSnapshot>) => void,
  onError?: (error: Error) => void,
) {
  const emit = () => {
    try {
      if (ref.type === 'doc') onNext(docSnapshot(ref.path));
      else {
        const constraints = ref.type === 'query' ? ref.constraints : [];
        onNext(querySnapshot(ref.path, constraints));
      }
    } catch (error) {
      onError?.(error as Error);
    }
  };
  emit();
  return subscribeStore(emit);
}
