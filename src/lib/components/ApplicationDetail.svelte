<script lang="ts">
  import { Archive, ArchiveRestore, GripVertical, Plus, ArrowUp, ArrowDown } from 'lucide-svelte';
  import { workspace, moveRank } from '$lib/workspace.svelte';
  import { statuses, initials } from '$lib/model';
  import Dialog from './Dialog.svelte';
  import FieldInput from './FieldInput.svelte';
  import Checklist from './Checklist.svelte';
  import Timeline from './Timeline.svelte';
  import Documents from './Documents.svelte';
  import OfferDetails from './OfferDetails.svelte';
  import Fees from './Fees.svelte';
  let { applicationId }: { applicationId: string } = $props();
  let application = $derived(workspace.applications.find(a => a.id === applicationId)!);
  let tab = $state('details');
  let rank = $derived(workspace.applications.filter(a => !a.archived).findIndex(a => a.id === application.id) + 1);
  let completed = $derived(application.requirements.filter(r => r.done).length);
</script>
<Dialog title="Application" drawer close={() => workspace.selectedId = null}>
  <div class="detail-identity">
    <span class="university-mark large" style={'--mark:' + application.color}>{application.monogram}</span>
    <div class="min-w-0 flex-1"><input class="title-input" aria-label="University name" value={application.university} oninput={(e) => { application.university = e.currentTarget.value; application.monogram = initials(application.university); }} /><input class="subtitle-input" aria-label="Program name" bind:value={application.program} /></div>
  </div>
  <div class="detail-timeline"><Timeline {application} /></div>
  <div class="segmented detail-tabs" aria-label="Application sections">
    <button class:active={tab === 'details'} onclick={() => tab = 'details'}>Details</button>
    <button class:active={tab === 'checklist'} onclick={() => tab = 'checklist'}>Checklist <span>{completed}/{application.requirements.length}</span></button>
    <button class:active={tab === 'documents'} onclick={() => tab = 'documents'}>Documents</button>
    <button class:active={tab === 'offer'} onclick={() => tab = 'offer'}>Decision & funding</button>
    <button class:active={tab === 'fees'} onclick={() => tab = 'fees'}>Fees</button>
  </div>
  <div class="detail-body">
    {#if tab === 'details'}
      <div class="field-grid">
        <label class="field-label">Status<select class="field-input" aria-label="Status" bind:value={application.status}>{#each statuses as status}<option>{status.label}</option>{/each}</select></label>
        <label class="field-label">Intake<input class="field-input" bind:value={application.intake} placeholder="Fall 2028" /></label>
        <label class="field-label">Application deadline<input class="field-input" type="date" bind:value={application.deadline} /></label>
        <label class="field-label">Location<input class="field-input" bind:value={application.location} placeholder="City, country" /></label>
      </div>
      <div class="field-grid mt-5">
        <label class="field-label">Application link<input class="field-input" type="url" aria-label="Application link" maxlength="2000" bind:value={application.applicationUrl} placeholder="https://" /></label>
        <label class="field-label">Official source<input class="field-input" type="url" maxlength="2000" bind:value={application.sourceUrl} placeholder="https://" /></label>
        <label class="field-label">Last checked<input class="field-input" type="date" bind:value={application.checkedDate} /></label>
      </div>
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
  <div class="detail-footer"><span class="text-xs text-muted">{workspace.saveState}</span><button class="text-btn" onclick={() => { application.archived = !application.archived; workspace.selectedId = null; }}>{#if application.archived}<ArchiveRestore size={15} />Restore{:else}<Archive size={15} />Archive{/if}</button></div>
</Dialog>
