'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Logo } from '@/components/icons';
import { useUser, useAuth } from '@/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    // If user is logged in and verified, redirect to dashboard
    if (user && user.emailVerified) {
      router.push('/');
    }
    // If user is not logged in, redirect to login page
    if (!user) {
        router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleResendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        toast({
          title: 'Verification Email Sent',
          description: 'A new verification link has been sent to your email address.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to send verification email.',
        });
      }
    }
  };

  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
  };

  // While loading, or if the user object is not yet available, show nothing.
  // The useEffect handles the redirection logic.
  if (isUserLoading || !user) {
    return null; // Or a loading spinner
  }

  // If the user is verified, they will be redirected by the useEffect. 
  // We can return null here as well to avoid a flash of content.
  if (user.emailVerified) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <MailCheck className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to{' '}
            <span className="font-semibold text-foreground">{user.email}</span>. Please
            check your inbox to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Click the button below to resend it.
          </p>
          <Button onClick={handleResendVerification} className="w-full">
            Resend Verification Email
          </Button>
           <p className="text-sm text-muted-foreground pt-4">
            After verifying, you can{' '}
            <Link href="/" className="underline font-semibold">
                continue to the dashboard
            </Link>
            {' '}or{' '}
             <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleLogout}>
                log out
             </Button>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
