<script lang="ts">
  import { Archive, ArchiveRestore, GripVertical, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-svelte';
  import { workspace, moveRank, deleteArchivedApplication } from '$lib/workspace.svelte';
  import { initials, applicationLink, safeLink } from '$lib/model';
  import Dialog from './Dialog.svelte';
  import FieldInput from './FieldInput.svelte';
  import Checklist from './Checklist.svelte';
  import Timeline from './Timeline.svelte';
  import Documents from './Documents.svelte';
  import OfferDetails from './OfferDetails.svelte';
  import Fees from './Fees.svelte';
  import ProgramFields from './ProgramFields.svelte';
  let { applicationId }: { applicationId: string } = $props();
  let application = $derived(workspace.applications.find(a => a.id === applicationId)!);
  let tab = $state('details');
  let confirmingDelete = $state(false);
  let rank = $derived(workspace.applications.filter(a => !a.archived).findIndex(a => a.id === application.id) + 1);
  let completed = $derived(application.requirements.filter(r => r.done).length);
</script>
<Dialog title="Application" drawer close={() => workspace.selectedId = null}>
  <div class="detail-identity">
    <span class="university-mark large" style={'--mark:' + application.color}>{application.monogram}</span>
    <div class="min-w-0 flex-1"><input class="title-input" aria-label="University name" maxlength="150" placeholder="University name" value={application.university} oninput={(e) => { application.university = e.currentTarget.value; application.monogram = initials(application.university); }} /><input class="subtitle-input" aria-label="Program name" maxlength="150" placeholder="Program name" bind:value={application.program} /><div class="detail-quick-links">{#if safeLink(application.sourceUrl)}<a href={safeLink(application.sourceUrl)} target="_blank" rel="noopener noreferrer">Program page ↗</a>{/if}{#if applicationLink(application, workspace.fields)}<a href={applicationLink(application, workspace.fields)} target="_blank" rel="noopener noreferrer">Application portal ↗</a>{/if}</div></div>
  </div>
  <div class="detail-timeline"><Timeline {application} /></div>
  <div class="segmented detail-tabs" aria-label="Application sections">
    <button class:active={tab === 'details'} aria-pressed={tab === 'details'} onclick={() => tab = 'details'}>Details</button>
    <button class:active={tab === 'checklist'} aria-pressed={tab === 'checklist'} onclick={() => tab = 'checklist'}>Checklist <span>{completed}/{application.requirements.length}</span></button>
    <button class:active={tab === 'documents'} aria-pressed={tab === 'documents'} onclick={() => tab = 'documents'}>Documents</button>
    <button class:active={tab === 'offer'} aria-pressed={tab === 'offer'} onclick={() => tab = 'offer'}>Decision & funding</button>
    <button class:active={tab === 'fees'} aria-pressed={tab === 'fees'} onclick={() => tab = 'fees'}>Fees</button>
  </div>
  <div class="detail-body">
    {#if tab === 'details'}
      <ProgramFields bind:value={application} />
      <label class="field-label mt-5">Last checked<input class="field-input" type="date" bind:value={application.checkedDate} /></label>
      <div class="rank-control"><span class="field-label">Ranking</span><div class="flex items-center gap-2"><GripVertical size={16} class="text-muted" /><span class="rank-value">{application.archived ? 'Archived' : '#' + rank}</span><button class="icon-btn" aria-label="Move ranking up" disabled={rank <= 1 || application.archived} onclick={() => moveRank(application.id, -1)}><ArrowUp size={15} /></button><button class="icon-btn" aria-label="Move ranking down" disabled={rank === workspace.applications.filter(a => !a.archived).length || application.archived} onclick={() => moveRank(application.id, 1)}><ArrowDown size={15} /></button></div></div>
      <div class="section-heading"><h3>Your fields</h3><button class="text-btn" onclick={() => workspace.modal = 'fields'}><Plus size={14} />Add field</button></div>
      <div class="field-grid">
        {#each workspace.fields as field (field.id)}
          <div class="field-label" class:full-width={field.type === 'textarea'}><span>{field.label}</span><FieldInput {field} bind:value={application.fields[field.id]} /></div>
        {/each}
      </div>
    {:else if tab === 'offer'}<OfferDetails {applicationId} />
    {:else if tab === 'documents'}<Documents {applicationId} />
    {:else if tab === 'fees'}<Fees {applicationId} />
    {:else}
      <div class="section-heading"><h3>Requirements</h3><span class="text-xs text-muted">{completed} of {application.requirements.length}</span></div>
      <Checklist applicationId={application.id} editable />
    {/if}
  </div>
  <div class="detail-footer" class:confirming-delete={confirmingDelete}>
    {#if confirmingDelete && application.archived}
      <p class="delete-program-message">Delete {application.university} · {application.program}?<span>This permanently removes this application and its fees. Uploaded documents stay in your library.</span></p>
      <div class="delete-program-actions"><button class="secondary-btn" onclick={() => confirmingDelete = false}>Cancel</button><button class="secondary-btn danger-text" onclick={() => deleteArchivedApplication(application.id)}><Trash2 size={15} />Delete permanently</button></div>
    {:else}
      <div class="detail-save-state"><span class="text-xs text-muted" role="status">{workspace.saveState}</span><div class="flex items-center gap-4"><button class="text-btn" onclick={() => { application.archived = !application.archived; workspace.selectedId = null; }}>{#if application.archived}<ArchiveRestore size={15} />Restore{:else}<Archive size={15} />Archive{/if}</button>{#if application.archived}<button class="text-btn danger-text" onclick={() => confirmingDelete = true}><Trash2 size={15} />Delete</button>{/if}</div></div><button class="primary-btn" onclick={() => workspace.selectedId = null}>Done</button>
    {/if}
  </div>
</Dialog>
