<script lang="ts">
  import { ArrowRight, ClipboardCheck } from 'lucide-svelte';
  import { workspace, addApplication } from '$lib/workspace.svelte';
  import { type ApplicationDraft, type FieldValue } from '$lib/model';
  import Dialog from './Dialog.svelte';
  import ProgramFields from './ProgramFields.svelte';
  import FieldInput from './FieldInput.svelte';
  let draft = $state<ApplicationDraft>({ university: '', program: '', intake: '', location: '', deadline: '', status: 'Considering', sourceUrl: '', applicationUrl: '' });
  let standardChecklist = $state(true);
  let fields = $state<Record<string, FieldValue>>({});
  const duplicate = $derived(workspace.applications.find(app => app.university.trim().toLowerCase() === draft.university.trim().toLowerCase() && app.program.trim().toLowerCase() === draft.program.trim().toLowerCase() && app.intake.trim().toLowerCase() === draft.intake.trim().toLowerCase()));
  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!draft.university.trim() || !draft.program.trim()) return;
    addApplication(draft, standardChecklist, fields);
  }
</script>

<Dialog title="Add program" initialFocus="[name='university']" close={() => workspace.modal = null}>
  <form onsubmit={submit}>
    <div class="dialog-content program-form">
      <ProgramFields bind:value={draft} identity />
      <label class="checklist-choice"><ClipboardCheck size={20} /><span><strong>Start with a standard checklist</strong><small>CV, statement, transcripts, references & test scores. Edit anytime.</small></span><input type="checkbox" bind:checked={standardChecklist} /></label>
      {#if workspace.fields.length}
        <details class="program-links"><summary>Your fields<span class="text-xs text-muted">{workspace.fields.length} custom fields</span></summary><div class="field-grid program-custom-fields">{#each workspace.fields as field (field.id)}<div class="field-label" class:full-width={field.type === 'textarea'}><span>{field.label}</span><FieldInput {field} bind:value={fields[field.id]} /></div>{/each}</div></details>
      {/if}
      {#if duplicate}<p class="form-hint" role="status">This program and intake are already in your {duplicate.archived ? 'archive' : 'shortlist'}. Adding creates a separate application.</p>{/if}
    </div>
    <div class="dialog-actions"><button class="secondary-btn" type="button" onclick={() => workspace.modal = null}>Cancel</button><button class="primary-btn" disabled={!draft.university.trim() || !draft.program.trim()}>Add program<ArrowRight size={16} /></button></div>
  </form>
</Dialog>
