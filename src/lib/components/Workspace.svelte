<script lang="ts">
  import { onMount } from 'svelte';
  import { GraduationCap, Sun, Moon, PanelLeftClose, PanelLeftOpen, Layers, CalendarDays, Archive, SlidersHorizontal, Plus, Search, Rows3, GitCommitHorizontal, ChevronRight, Download, ArrowUp, ArrowDown, X, CircleCheck, Wallet, FileText, CalendarCheck } from 'lucide-svelte';
  import { workspace, loadDemo, loadWorkspace, snapshot, saveWorkspace, toggleTheme, reorder, moveRank, exportWorkspace } from '$lib/workspace.svelte';
  import { formatDate, stageOf, isAccepted, isRejected, statuses, type Application, applicationLink } from '$lib/model';
  import Timeline from '$lib/components/Timeline.svelte';
  import Checklist from '$lib/components/Checklist.svelte';
  import FieldInput from '$lib/components/FieldInput.svelte';
  import ApplicationDetail from '$lib/components/ApplicationDetail.svelte';
  import WorkspaceDialogs from '$lib/components/WorkspaceDialogs.svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import UpcomingTasks from '$lib/components/UpcomingTasks.svelte';
  import Documents from '$lib/components/Documents.svelte';
  import Fees from '$lib/components/Fees.svelte';
  let { demo = false }: { demo?: boolean } = $props();
  const load = () => demo ? loadDemo() : loadWorkspace();
  let mobileMenu = $state(false);
  let dropTarget = $state('');
  let selected = $derived(workspace.applications.find(a => a.id === workspace.selectedId));
  let active = $derived(workspace.applications.filter(a => !a.archived));
  let filtered = $derived.by(() => {
    let items = workspace.applications.filter(a => a.archived === (workspace.section === 'archive'));
    const q = workspace.query.trim().toLowerCase();
    if (q) items = items.filter(a => `${a.university} ${a.program} ${a.intake} ${a.location}`.toLowerCase().includes(q));
    if (workspace.filter !== 'All') items = items.filter(a => workspace.filter === 'Preparing' ? stageOf(a.status) <= 2 : workspace.filter === 'Submitted' ? stageOf(a.status) === 3 || stageOf(a.status) === 4 : stageOf(a.status) === 5);
    return items;
  });
  let dated = $derived([...filtered].filter(a => a.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)));
  let completed = $derived(active.filter(a => stageOf(a.status) >= 3).length);
  let offers = $derived(active.filter(a => isAccepted(a.status)).length);
  let visibleFields = $derived(workspace.fields.filter(f => f.visible));
  let requirementNames = $derived([...new Set(filtered.flatMap(a => a.requirements.map(r => r.label)))]);
  onMount(() => {
    void load();
    const recheck = (event: PageTransitionEvent) => { if (event.persisted) { workspace.loaded = false; void load(); } };
    window.addEventListener('pageshow', recheck);
    return () => window.removeEventListener('pageshow', recheck);
  });
  $effect(() => {
    const value = snapshot();
    if (workspace.loaded && workspace.user && !workspace.demo) { workspace.saveState = 'Saving…'; const timer = setTimeout(() => saveWorkspace(value), 250); return () => clearTimeout(timer); }
  });
  function navigate(section: typeof workspace.section) { workspace.section = section; workspace.filter = 'All'; mobileMenu = false; }
  function progress(app: Application) { return app.requirements.filter(r => r.done).length; }
  function rank(app: Application) { return active.findIndex(a => a.id === app.id) + 1; }
  function startDrag(event: DragEvent, id: string) { workspace.draggedId = id; if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); } }
  function drop(event: DragEvent, target: string) { event.preventDefault(); if (workspace.draggedId) reorder(workspace.draggedId, target); workspace.draggedId = null; dropTarget = ''; }
  function endDrag() { workspace.draggedId = null; dropTarget = ''; }
  function toggleRequirement(app: Application, label: string, done: boolean) { const requirement = app.requirements.find(r => r.label === label); if (requirement) requirement.done = done; }
</script>

<svelte:head><title>DropThatUni · {demo ? 'Demo' : 'Applications'}</title><meta name="description" content="Your university applications, in one place." /></svelte:head>

<div class="ambient" aria-hidden="true"></div>
<SiteHeader />

{#if workspace.loaded && (workspace.user || workspace.demo)}
<div class="app-shell" class:sidebar-collapsed={workspace.collapsed} inert={!workspace.loaded || (!workspace.user && !workspace.demo)}>
  <aside class="sidebar glass" class:mobile-open={mobileMenu} aria-label="Workspace navigation">
    <div class="sidebar-heading"><span class="sidebar-copy eyebrow">Workspace</span><button class="quiet-icon" aria-label={workspace.collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!workspace.collapsed} onclick={() => workspace.collapsed = !workspace.collapsed}>{#if workspace.collapsed}<PanelLeftOpen size={18} />{:else}<PanelLeftClose size={18} />{/if}</button><button class="quiet-icon mobile-close" aria-label="Close menu" onclick={() => mobileMenu = false}><X size={18} /></button></div>
    <nav class="sidebar-nav" aria-label="Workspace views">
      <button class:active={workspace.section === 'applications'} aria-label="Applications" title="Applications" onclick={() => navigate('applications')}><Layers size={18} /><span class="sidebar-copy">Applications</span><span class="sidebar-count sidebar-copy">{active.length}</span></button>
      <button class:active={workspace.section === 'tasks'} title="Upcoming tasks" onclick={() => navigate('tasks')}><CalendarCheck size={18} /><span class="sidebar-copy">Upcoming tasks</span></button>
      <button class:active={workspace.section === 'deadlines'} title="Deadlines" onclick={() => navigate('deadlines')}><CalendarDays size={18} /><span class="sidebar-copy">Deadlines</span></button>
      <button class:active={workspace.section === 'archive'} title="Archive" onclick={() => navigate('archive')}><Archive size={18} /><span class="sidebar-copy">Archive</span></button>
      <button class:active={workspace.section === 'fees'} title="Fees" onclick={() => navigate('fees')}><Wallet size={18} /><span class="sidebar-copy">Fees</span></button>
      <button class:active={workspace.section === 'documents'} title="Documents" onclick={() => navigate('documents')}><FileText size={18} /><span class="sidebar-copy">Documents</span></button>
    </nav>
    <div class="sidebar-divider"></div>
    <button class="sidebar-tool" title="Fields & columns" onclick={() => { workspace.modal = 'fields'; mobileMenu = false; }}><SlidersHorizontal size={17} /><span class="sidebar-copy">Fields & columns</span></button>
    <button class="sidebar-tool" title="Export workspace" onclick={exportWorkspace}><Download size={17} /><span class="sidebar-copy">Export</span></button>
    {#if workspace.demo}<button class="sidebar-tool" title="Reset demo" onclick={loadDemo}><Layers size={17} /><span class="sidebar-copy">Reset demo</span></button>{/if}
    <div class="sidebar-bottom"><span class="sidebar-copy text-xs text-muted">{workspace.demo ? 'Demo workspace' : 'Personal workspace'}</span><div class="device-status" title={workspace.saveState}><span class="save-dot"></span><span class="sidebar-copy">{workspace.saveState}</span></div></div>
  </aside>
  {#if mobileMenu}<button class="mobile-scrim" aria-label="Close navigation" onclick={() => mobileMenu = false}></button>{/if}

  <main class="min-w-0">
    <div class="page-heading">
      <div class="flex items-center gap-3"><button class="icon-btn mobile-menu" aria-label="Open navigation" onclick={() => mobileMenu = true}><PanelLeftOpen size={19} /></button><h1>{workspace.section === 'applications' ? 'Applications' : workspace.section === 'deadlines' ? 'Deadlines' : workspace.section === 'tasks' ? 'Upcoming tasks' : workspace.section === 'fees' ? 'Fees' : workspace.section === 'documents' ? 'Documents' : 'Archive'}<span class="text-accent">.</span></h1></div>
      {#if workspace.section !== 'fees' && workspace.section !== 'documents' && workspace.section !== 'tasks'}<button class="primary-btn" onclick={() => workspace.modal = 'add'}><Plus size={17} /><span>Add program</span></button>{/if}
    </div>
    {#if workspace.notice}<div class="notice" role="alert">{workspace.notice}<button class="quiet-icon" aria-label="Dismiss" onclick={() => workspace.notice = ''}><X size={15} /></button></div>{/if}
    {#if workspace.section === 'tasks'}<section class="workspace-panel glass supplemental-panel" aria-label="Upcoming tasks"><UpcomingTasks /></section>
    {:else if workspace.section === 'fees'}<section class="workspace-panel glass supplemental-panel" aria-label="Fees"><Fees /></section>
    {:else if workspace.section === 'documents'}<section class="workspace-panel glass supplemental-panel" aria-label="Documents"><Documents /></section>
    {:else}
    <div class="summary-strip">
      <div><Layers size={16} /><span><strong>{active.length}</strong> programs</span></div>
      <div><CircleCheck size={16} /><span><strong>{completed}</strong> submitted</span></div>
      <div><GraduationCap size={17} /><span><strong>{offers}</strong> offers</span></div>
    </div>
    <section class="workspace-panel glass" aria-label="Application workspace">
      <div class="workspace-toolbar">
        <label class="search-box"><Search size={17} /><input aria-label="Search programs" placeholder="Search programs" bind:value={workspace.query} />{#if workspace.query}<button class="quiet-icon" aria-label="Clear search" onclick={() => workspace.query = ''}><X size={14} /></button>{/if}</label>
        <div class="toolbar-actions">
          {#if workspace.section !== 'deadlines'}<div class="segmented" aria-label="View"><button class:active={workspace.view === 'clean'} aria-pressed={workspace.view === 'clean'} onclick={() => workspace.view = 'clean'}><GitCommitHorizontal size={16} /><span>Clean</span></button><button class:active={workspace.view === 'table'} aria-pressed={workspace.view === 'table'} onclick={() => workspace.view = 'table'}><Rows3 size={16} /><span>Table</span></button></div>{/if}
          <select class="toolbar-select" aria-label="Row density" bind:value={workspace.density}><option value="compact">Compact</option><option value="comfortable">Standard</option><option value="spacious">Spacious</option></select>
          <button class="icon-btn" title="Fields & columns" aria-label="Fields & columns" onclick={() => workspace.modal = 'fields'}><SlidersHorizontal size={17} /></button>
        </div>
      </div>
      <div class="filter-toolbar">
        <div class="filter-tabs" aria-label="Filter by stage">{#each ['All', 'Preparing', 'Submitted', 'Decided'] as filter}<button class:active={workspace.filter === filter} aria-pressed={workspace.filter === filter} onclick={() => workspace.filter = filter}>{filter}</button>{/each}</div>
        <label class="checklist-switch"><input type="checkbox" checked={workspace.checklist === 'inline'} onchange={(e) => workspace.checklist = e.currentTarget.checked ? 'inline' : 'summary'} /><span>Show checklist</span></label>
      </div>

      {#if workspace.section === 'deadlines'}
        <div class="deadline-list" data-density={workspace.density}>
          {#each dated as app (app.id)}
            <button class="deadline-row" onclick={() => workspace.selectedId = app.id}><div class="date-block"><span>{new Date(app.deadline + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</span><strong>{new Date(app.deadline + 'T12:00:00').getDate()}</strong><small>{app.deadline.slice(0, 4)}</small></div><span class="university-mark" style={'--mark:' + app.color}>{app.monogram}</span><div class="flex-1 text-left min-w-0"><h3>{app.university}</h3><p>{app.program} · {app.intake}</p></div><span class="status-pill" class:offer={isAccepted(app.status)}>{app.status}</span><ChevronRight size={18} class="text-muted" /></button>
          {:else}<div class="empty-state"><CalendarDays size={28} /><h3>No deadlines</h3><p>Add a date in your program details.</p></div>{/each}
        </div>
      {:else if workspace.view === 'clean'}
        <div class="list-heading"><span>Program</span><span class="journey-heading">Progress</span><span class="deadline-heading">Deadline</span></div>
        <ol class="application-list" data-density={workspace.density}>
          {#each filtered as app (app.id)}
            <li class="application-row" class:dragging={workspace.draggedId === app.id} class:drop-target={dropTarget === app.id} ondragover={(e) => { if (workspace.draggedId) { e.preventDefault(); dropTarget = app.id; } }} ondrop={(e) => drop(e, app.id)}>
              <div class="application-main">
                <div class="rank-group"><button class="drag-handle" disabled={app.archived} draggable={!app.archived} aria-label={'Drag to rank ' + app.university + '. Use arrow keys to reorder.'} title="Drag to rank · ↑↓ to move" ondragstart={(e) => startDrag(e, app.id)} ondragend={endDrag} onkeydown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); moveRank(app.id, e.key === 'ArrowUp' ? -1 : 1); } }}><span class="rank-number">{app.archived ? '—' : rank(app)}</span></button></div>
                <button class="program-identity" aria-label={'Open ' + app.university} onclick={() => workspace.selectedId = app.id}><span class="program-copy"><strong>{app.university}</strong><span>{app.program}</span><small>{app.intake}</small></span></button>
                <button class="journey-button" aria-label={'Open ' + app.university + ', ' + app.status} onclick={() => workspace.selectedId = app.id}><Timeline application={app} compact /></button>
                <button class="deadline-cell" aria-label={'Edit deadline for ' + app.university} onclick={() => workspace.selectedId = app.id}><span>{formatDate(app.deadline)}</span><small>{app.deadline ? app.deadline.slice(0, 4) : 'Set deadline'}</small></button>
                <button class="quiet-icon row-open" aria-label={'View details for ' + app.university} onclick={() => workspace.selectedId = app.id}><ChevronRight size={18} /></button>
              </div>
              {#if workspace.checklist === 'inline'}<div class="inline-requirements"><Checklist applicationId={app.id} compact /></div>{/if}
            </li>
          {:else}<div class="empty-state"><Layers size={28} /><h3>{workspace.query || workspace.filter !== 'All' ? 'No matching programs' : workspace.section === 'archive' ? 'Nothing archived' : 'Your shortlist starts here'}</h3>{#if workspace.section !== 'archive'}<button class="secondary-btn mt-4" onclick={() => workspace.modal = 'add'}><Plus size={15} />Add program</button>{/if}</div>{/each}
        </ol>
      {:else}
        <div class="table-scroll" data-density={workspace.density}>
          <table class="application-table"><thead><tr><th class="sticky-col rank-th">#</th><th class="program-th">Program</th><th>Intake</th><th>Deadline</th><th>Status</th><th>Checklist</th>{#if workspace.checklist === 'inline'}{#each requirementNames as name}<th>{name}</th>{/each}{/if}{#each visibleFields as field}<th>{field.label}</th>{/each}<th><button class="text-btn" aria-label="Add column" onclick={() => workspace.modal = 'fields'}><Plus size={15} /></button></th></tr></thead>
            <tbody>{#each filtered as app (app.id)}<tr>
              <td class="sticky-col"><div class="table-rank"><span>{app.archived ? '—' : rank(app)}</span><div><button class="quiet-icon" disabled={rank(app) <= 1 || app.archived} aria-label={'Move ' + app.university + ' up'} onclick={() => moveRank(app.id, -1)}><ArrowUp size={11} /></button><button class="quiet-icon" disabled={rank(app) === active.length || app.archived} aria-label={'Move ' + app.university + ' down'} onclick={() => moveRank(app.id, 1)}><ArrowDown size={11} /></button></div></div></td>
              <td><button class="table-program" onclick={() => workspace.selectedId = app.id}><span class="university-mark small" style={'--mark:' + app.color}>{app.monogram}</span><span><strong>{app.university}</strong><small>{app.program}</small></span></button>{#if applicationLink(app, workspace.fields)}<a class="table-application-link" href={applicationLink(app, workspace.fields)} target="_blank" rel="noopener noreferrer" aria-label={'Application portal for ' + app.university}>Application portal ↗</a>{/if}</td>
              <td><input class="cell-input" aria-label={'Intake for ' + app.university} bind:value={app.intake} /></td>
              <td><input class="cell-input" type="date" aria-label={'Deadline for ' + app.university} bind:value={app.deadline} /></td>
              <td><select class="cell-input status-select" aria-label={'Status for ' + app.university} bind:value={app.status}>{#each statuses as status}<option>{status.label}</option>{/each}</select></td>
              <td><button class="progress-button" onclick={() => workspace.selectedId = app.id}><span class="progress-track"><span style={'width:' + (app.requirements.length ? progress(app) / app.requirements.length * 100 : 0) + '%'}></span></span>{progress(app)}/{app.requirements.length}</button></td>
              {#if workspace.checklist === 'inline'}{#each requirementNames as name}<td class="text-center">{#if app.requirements.some(r => r.label === name)}<input type="checkbox" aria-label={name + ' for ' + app.university} checked={app.requirements.find(r => r.label === name)?.done} onchange={(e) => toggleRequirement(app, name, e.currentTarget.checked)} />{:else}<span class="text-muted">—</span>{/if}</td>{/each}{/if}
              {#each visibleFields as field}<td><FieldInput {field} compact bind:value={app.fields[field.id]} /></td>{/each}<td><button class="quiet-icon" aria-label={'Open ' + app.university} onclick={() => workspace.selectedId = app.id}><ChevronRight size={16} /></button></td>
            </tr>{/each}</tbody>
          </table>
          {#if !filtered.length}<div class="empty-state"><h3>No matching programs</h3></div>{/if}
        </div>
      {/if}
      <div class="workspace-footer"><span>{filtered.length} {filtered.length === 1 ? 'program' : 'programs'}</span><button class="text-btn" onclick={() => workspace.modal = 'add'}><Plus size={13} />Add program</button></div>
    </section>
    {/if}
  </main>
</div>
{#if selected}<ApplicationDetail applicationId={selected.id} />{/if}
<WorkspaceDialogs />

{/if}

{#if workspace.loaded && !workspace.user && workspace.notice}
<main class="import-page"><section class="glass import-card"><p role="alert">{workspace.notice}</p><button class="secondary-btn mt-5" onclick={() => void load()}>Retry</button></section></main>
{/if}
