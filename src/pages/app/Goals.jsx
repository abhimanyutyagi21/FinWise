import { useUI } from '../../context/UIContext.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { Metric, PageHead } from '../../components/ui/Bits.jsx';

const numOf = (v) => Number(String(v).replace(/,/g, ''));

export default function Goals() {
  const { goals, profile, money, sym, addGoal, setGoalSaved, addToGoal, removeGoal } = useWorkspace();
  const { dialog, confirm, say } = useUI();

  const saved = goals.reduce((s, g) => s + (Number(g.saved) || 0), 0);
  const target = goals.reduce((s, g) => s + (Number(g.target) || 0), 0);

  const onAdd = async () => {
    const r = await dialog({
      title: 'Add a savings goal',
      message: 'Name what you are saving for and set a target.',
      icon: '◎',
      confirmText: 'Add goal',
      fields: [
        { id: 'name', label: 'Goal name', placeholder: 'Enter your goal name' },
        { id: 'target', label: `Target amount (${sym})`, placeholder: 'Enter your target amount', number: 1, max: 14 },
      ],
      validate: (v) => (!v.name ? 'Please give your goal a name.' : !(numOf(v.target) > 0) ? 'Please enter a target above 0.' : ''),
    });
    if (!r) return;
    if (await addGoal({ name: r.name.slice(0, 60), target: numOf(r.target) })) say('Your new goal has been added.');
  };

  const onEdit = async (i) => {
    const g = goals[i];
    if (!g) return;
    const r = await dialog({
      title: 'Update progress',
      message: 'How much have you saved toward ' + g.name + ' so far?',
      icon: '↗',
      confirmText: 'Save progress',
      fields: [{ id: 'v', label: `Amount saved (${sym})`, value: g.saved, placeholder: 'Enter the amount saved', number: 1, max: 14 }],
      validate: (v) => {
        const x = numOf(v.v);
        return v.v === '' || !Number.isFinite(x) || x < 0 ? 'Please enter an amount of 0 or more.' : '';
      },
    });
    if (!r) return;
    if (await setGoalSaved(g.id, numOf(r.v))) say('Goal progress updated.');
  };

  const onAddSavings = async (i) => {
    const g = goals[i];
    if (!g) return;
    const r = await dialog({
      title: 'Add savings',
      message: 'How much are you adding to ' + g.name + '?',
      icon: '+',
      confirmText: 'Add to goal',
      fields: [{ id: 'v', label: `Amount to add (${sym})`, placeholder: 'Enter the amount to add', number: 1, max: 14 }],
      validate: (v) => (!(numOf(v.v) > 0) ? 'Please enter an amount above 0.' : ''),
    });
    if (!r) return;
    if (await addToGoal(g.id, numOf(r.v))) say('Savings added to your goal.');
  };

  const onRemove = async (i) => {
    const ok = await confirm('Remove this goal?', 'This removes the goal and its saved amount from your workspace.', { danger: true, confirmText: 'Remove goal' });
    if (!ok) return;
    if (await removeGoal(goals[i].id)) say('Goal removed.');
  };

  return (
    <>
      <PageHead
        kicker="FUTURE YOU, IN FOCUS"
        title="Give your goals a place in the plan."
        sub="Track what you are saving toward and adjust the targets as your priorities change."
        action={<button className="button-dark" onClick={onAdd}>＋ Add a goal</button>}
      />
      <div className="metrics-grid">
        <Metric label="Total saved" value={saved} foot="Across all your goals" icon="◉" />
        <Metric label="Combined targets" value={target} foot={goals.length + (goals.length === 1 ? ' goal' : ' goals')} icon="◎" />
        <Metric label="Overall progress" value={target > 0 ? Math.round((saved / target) * 100) + '%' : '0%'} foot="Saved vs targets" icon="↗" />
        <Metric label="Planned each month" value={Number(profile.savings) || 0} foot="Your monthly savings plan" icon="↻" />
      </div>
      <div className="goal-cards">
        {goals.map((g, i) => (
          <article className="goal-card" key={g.id}>
            <div className="goal-card-top">
              <span>{g.icon}</span>
              <button onClick={() => onRemove(i)} aria-label={'Remove ' + g.name}>•••</button>
            </div>
            <h3>{g.name}</h3>
            <p>Personal savings goal</p>
            <div className="goal-big">{money(g.saved)}</div>
            <div className="goal-meta">of {money(g.target)} target · {Math.round((g.saved / g.target) * 100)}% there</div>
            <div className="goal-track"><i style={{ width: Math.min(100, (g.saved / g.target) * 100) + '%' }}></i></div>
            <div className="goal-actions">
              <button className="button-quiet" onClick={() => onEdit(i)} style={{ marginTop: 14 }}>Update progress ↗</button>
              <button className="button-quiet" onClick={() => onAddSavings(i)} style={{ marginTop: 14 }}>＋ Add savings</button>
            </div>
          </article>
        ))}
      </div>
      <section className="panel" style={{ marginTop: 17 }}>
        <div className="panel-head"><div><h3>Your goal picture</h3><p>Small steps make longer plans feel more tangible.</p></div></div>
        <div className="cash-summary">
          <div><span>Total target across goals</span><b>{money(goals.reduce((s, g) => s + g.target, 0))}</b></div>
          <div><span>Already saved</span><b>{money(goals.reduce((s, g) => s + g.saved, 0))}</b></div>
          <div><span>Still to save</span><b className="positive">{money(goals.reduce((s, g) => s + Math.max(0, g.target - g.saved), 0))}</b></div>
        </div>
      </section>
    </>
  );
}
