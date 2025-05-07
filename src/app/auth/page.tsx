
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

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
import { Label } from '@/components/ui/label'; // Keep Label for potential future direct use
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { firebaseConfig } from '@/lib/firebase-config'; 
import { ArrowLeft } from 'lucide-react';


// Initialize Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}
const auth = getAuth(getApp());


// Define Zod schemas for validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const registerSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'], // path of error
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [isLoginLoading, setIsLoginLoading] = React.useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = React.useState(false);

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
        description: `Welcome back, ${data.email}!`,
      });
      // TODO: Redirect to dashboard or user-specific page
      // router.push('/dashboard'); 
      loginForm.reset();
    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsRegisterLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Registration Successful',
        description: `Account created for ${data.email}. You can now log in.`,
      });
      // TODO: Optionally auto-login or redirect
      // router.push('/auth?tab=login'); // Redirect to login tab
      registerForm.reset();
    } catch (error: any) {
      console.error("Registration Error:", error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsRegisterLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-secondary p-4">
       <Link href="/" className="absolute left-4 top-4 md:left-8 md:top-8">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Home
          </Button>
      </Link>
      <Tabs defaultValue="login" className="w-full max-w-md">
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
                           {/* Optional: Add Forgot Password link */}
                           {/* <Link href="#" className="text-sm font-medium text-primary hover:underline">
                             Forgot password?
                           </Link> */}
                         </div>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? 'Logging in...' : 'Login'}
                  </Button>
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
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                     {isRegisterLoading ? 'Registering...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
