import { useNavigate } from 'react-router-dom';
import { useUI } from '../context/UIContext.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { auth } from '../lib/auth.js';

/** Change name, change currency and log out. Shared by the profile menu and Settings. */
export function useAccountActions(closeMenu) {
  const { dialog, confirm, say } = useUI();
  const ws = useWorkspace();
  const navigate = useNavigate();

  const changeName = async () => {
    closeMenu?.();
    const r = await dialog({
      title: 'Change your name',
      message: 'This is the name FinWise uses to greet you.',
      icon: '✎',
      confirmText: 'Save name',
      fields: [{ id: 'name', label: 'Your name', value: ws.profile.name || '', placeholder: 'Enter your name', max: 40 }],
      validate: (v) => (!v.name ? 'Please enter a name.' : ''),
    });
    if (!r) return;
    const name = r.name.slice(0, 40);
    if (await ws.updateProfile({ name })) say('Name updated to ' + name + '.');
  };

  const changeCurrency = async (code) => {
    const res = await ws.changeCurrency(code);
    closeMenu?.();
    if (res) say('Currency changed to ' + res.to + '. All amounts converted at 1 ' + res.from + ' = ' + Number(res.k.toPrecision(4)) + ' ' + res.to + '.');
  };

  const logOut = async () => {
    closeMenu?.();
    const ok = await confirm('Log out of FinWise?', 'Your workspace data stays saved on this device, so it will be here when you log back in.', {
      confirmText: 'Log out',
      icon: '⎋',
    });
    if (!ok) return;
    await auth.signOut();
    document.body.classList.add('leaving');
    setTimeout(() => navigate('/login', { replace: true }), 300);
  };

  return { changeName, changeCurrency, logOut };
}
