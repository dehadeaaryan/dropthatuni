<script lang="ts">
  import { onMount } from 'svelte';
  import { CalendarCheck, ChevronRight } from 'lucide-svelte';
  import { workspace } from '$lib/workspace.svelte';
  import { upcomingTasks } from '$lib/tasks';
  import { daysUntil, todayIn, formatDate } from '$lib/model';
  let now = $state(new Date());
  onMount(() => { const timer = setInterval(() => now = new Date(), 60_000); return () => clearInterval(timer); });
  let range = $state('30'), filter = $state('All');
  let tasks = $derived(upcomingTasks(workspace));
  let today = $derived(todayIn(workspace.reminders.timezone, now));
  let visible = $derived(tasks.filter(t => (range === 'all' || !t.dueDate || daysUntil(t.dueDate, today) <= Number(range)) && (filter === 'All' || filter === 'Overdue' && t.dueDate && daysUntil(t.dueDate, today) < 0 || filter === 'Undated' && !t.dueDate)));
  function open(task: typeof tasks[number]) { if (task.applicationId) workspace.selectedId = task.applicationId; else workspace.section = 'fees'; }
</script>
<div class="fee-toolbar"><div class="filter-tabs">{#each ['All', 'Overdue', 'Undated'] as value}<button class:active={filter === value} onclick={() => filter = value}>{value}</button>{/each}</div><select class="toolbar-select" aria-label="Task time range" bind:value={range}><option value="7">Next 7 days</option><option value="30">Next 30 days</option><option value="all">All dates</option></select></div>
<div class="task-list">
{#each visible as task (task.id)}
  <button class="task-row" onclick={() => open(task)}><span class="task-copy"><strong>{task.label}</strong><small>{task.university}</small></span><span class="task-date" class:danger-text={task.dueDate && daysUntil(task.dueDate, today) < 0}>{task.dueDate ? formatDate(task.dueDate) : 'No date'}{#if task.dueDate}<small>{daysUntil(task.dueDate, today) < 0 ? 'Overdue' : daysUntil(task.dueDate, today) === 0 ? 'Today' : daysUntil(task.dueDate, today) + ' days'}</small>{/if}</span><ChevronRight size={16} /></button>
{:else}<div class="empty-state"><CalendarCheck size={26} /><h3>No upcoming tasks</h3></div>{/each}
</div>
