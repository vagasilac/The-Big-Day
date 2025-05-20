
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import { auth, db } from '@/lib/firebase-config';
import { ArrowLeft, Info, Loader2 } from 'lucide-react';

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

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "demopassword123";

export default function AuthPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");


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
    const { signInWithEmailAndPassword } = await import('firebase/auth');
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

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsRegisterLoading(true);
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { doc, setDoc, Timestamp } = await import('firebase/firestore');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

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
    } catch (error: any) {
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
      title: "Demo Credentials Filled",
      description: "Ready to log in as the demo user.",
    });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-secondary p-4">
       <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
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
                  <Alert className="border-primary/30 bg-primary/5">
                    <Info className="h-5 w-5 text-primary" />
                    <AlertDescription className="text-sm text-foreground/80">
                      Try the demo account:
                      <Button
                        type="button"
                        variant="link"
                        onClick={fillDemoCredentials}
                        className="ml-1 p-0 h-auto text-sm text-primary hover:underline"
                      >
                        Fill demo credentials
                      </Button>
                    </AlertDescription>
                  </Alert>
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
                           <Link href="#" className="text-sm text-primary hover:underline"> {/* TODO: Implement forgot password */}
                            Forgot password?
                           </Link>
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
    </div>
  );
}
