'use client';

import { useRef, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { updateMyPassword } from './actions';

export function PasswordForm() {
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateMyPassword(fd);
      if (r.ok) {
        toast.success('Mot de passe mis à jour');
        formRef.current?.reset();
      } else toast.error(r.error);
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
      <Field label="Nouveau mot de passe" required hint="8 caractères minimum">
        <Input name="password" type="password" minLength={8} required autoComplete="new-password" />
      </Field>
      <Field label="Confirmer le mot de passe" required>
        <Input name="confirm" type="password" minLength={8} required autoComplete="new-password" />
      </Field>
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Changer
        </Button>
      </div>
    </form>
  );
}
