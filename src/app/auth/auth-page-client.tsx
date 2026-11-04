
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase-config';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, setLocalPassword, signInWithEmailAndPassword } from '@/lib/backend/auth';
import { doc, setDoc, Timestamp } from '@/lib/backend/firestore';
import { isLocalMode } from '@/lib/data-mode';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo-account';
import { LocalModeNote } from '@/components/local-mode-note';

// Define Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPageClient() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");
  const [showReset, setShowReset] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetPassword, setResetPassword] = React.useState('');
  const [resetLoading, setResetLoading] = React.useState(false);


  React.useEffect(() => {
    const tabQueryParam = searchParams.get('tab');
    if (tabQueryParam === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login'); // Default or if tab=login or invalid
    }
  }, [searchParams]); // Re-run if searchParams change

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onLoginSubmit(data: LoginFormValues) {
    setIsLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      loginForm.reset();
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Login Error:", error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-email':
            errorMessage = 'No user found with this email address.';
            break;
          case 'auth/wrong-password':
             errorMessage = 'Incorrect password. Please try again.';
            break;
          case 'auth/invalid-credential':
             errorMessage = 'Invalid email or password. Please check your credentials.';
            break;
          default:
            errorMessage = 'Login failed. Please try again later.';
        }
      }
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function onReset(event: React.FormEvent) {
    event.preventDefault();
    setResetLoading(true);
    try {
      if (isLocalMode()) {
        await setLocalPassword(resetEmail, resetPassword);
        toast({ title: 'Password updated', description: 'This browser-only account can now sign in with the new password.' });
      } else {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({ title: 'Reset email sent', description: 'Check the inbox for that address.' });
      }
      setShowReset(false);
    } catch (error: any) {
      toast({
        title: 'Could not reset password',
        description: error.message || 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsRegisterLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Create a user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: Timestamp.fromDate(new Date()),
      });

      toast({
        title: 'Registration Successful',
        description: `Account created for ${data.email}. You are now logged in.`,
      });
      registerForm.reset();
      router.push('/dashboard');
    } catch (error: any)
{
      console.error("Registration Error:", error);
      let errorMessage = 'An unexpected error occurred. Please try again.';
       if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already registered.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. It must be at least 6 characters long.';
            break;
          default:
            errorMessage = 'Registration failed. Please try again later.';
        }
      }
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsRegisterLoading(false);
    }
  }

  const fillDemoCredentials = () => {
    loginForm.setValue("email", DEMO_EMAIL);
    loginForm.setValue("password", DEMO_PASSWORD);
    toast({
      title: "Preview login filled",
      description: "This account exists only in this browser.",
    });
  };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-secondary p-4">
      <div className="absolute top-0 left-0 right-0"><LocalModeNote /></div>
       <Link href="/" className="absolute left-4 top-12 md:left-8">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Home
          </Button>
      </Link>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Welcome back! Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4">
                  {isLocalMode() ? (
                    <Alert className="border-primary/30 bg-primary/5">
                      <Info className="h-5 w-5 text-primary" />
                      <AlertDescription className="text-sm text-foreground/80">
                        Browser preview account (not a real person):
                        <Button
                          type="button"
                          variant="link"
                          onClick={fillDemoCredentials}
                          className="ml-1 p-0 h-auto text-sm text-primary hover:underline"
                        >
                          Fill preview login
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-5 w-5" />
                      <AlertDescription className="text-sm">
                        Sign in with an account on the Firebase project. There is no shared demo login in this mode.
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                         <div className="flex items-center justify-between">
                           <FormLabel>Password</FormLabel>
                           <button type="button" className="text-sm text-primary hover:underline" onClick={() => { setShowReset(true); setResetEmail(loginForm.getValues('email')); }}>
                            Forgot password?
                           </button>
                         </div>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-4">
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoginLoading ? 'Logging in...' : 'Login'}
                  </Button>
                   <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <Button variant="link" className="p-0 h-auto text-primary hover:underline" onClick={() => setActiveTab("register")}>
                      Create one
                    </Button>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Register</CardTitle>
              <CardDescription>
                Create an account to manage your wedding details.
              </CardDescription>
            </CardHeader>
             <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-4">
                 <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-4">
                  <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                     {isRegisterLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     {isRegisterLoading ? 'Registering...' : 'Create Account'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Button variant="link" className="p-0 h-auto text-primary hover:underline" onClick={() => setActiveTab("login")}>
                       Log in
                    </Button>
                  </p>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
      {showReset && (
        <Card className="w-full max-w-md mt-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Reset password</CardTitle>
            <CardDescription>
              {isLocalMode()
                ? 'Preview accounts live in this browser, so there is no email. Set a new password for an account that already exists here.'
                : 'We will email a reset link if this address has a Firebase account.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={onReset}>
            <CardContent className="space-y-3">
              <Input type="email" required placeholder="Email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} />
              {isLocalMode() && (
                <Input type="password" required minLength={6} placeholder="New password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" disabled={resetLoading}>
                {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLocalMode() ? 'Save new password' : 'Send reset email'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowReset(false)}>Cancel</Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </div>
  );
}

