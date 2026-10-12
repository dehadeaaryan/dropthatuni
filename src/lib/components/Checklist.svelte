<script lang="ts">
  import { Plus, X } from 'lucide-svelte';
  import { workspace } from '$lib/workspace.svelte';
  let { applicationId, editable = false, compact = false }: { applicationId: string; editable?: boolean; compact?: boolean } = $props();
  let application = $derived(workspace.applications.find(a => a.id === applicationId)!);
  let newItem = $state('');
  function add() { if (newItem.trim()) { application.requirements.push({ id: crypto.randomUUID(), label: newItem.trim(), done: false }); newItem = ''; } }
</script>
<div class="checklist" class:checklist-inline={compact}>
  {#each application.requirements as requirement (requirement.id)}
    <div class="checklist-item" class:done={requirement.done}>
      <label class="flex items-center gap-3 min-w-0 flex-1">
        <input type="checkbox" bind:checked={requirement.done} aria-label={requirement.label + ' for ' + application.university} />
        {#if editable}<input class="check-label" aria-label="Requirement name" bind:value={requirement.label} />{:else}<span>{requirement.label}</span>{/if}
      </label>
      {#if editable}<input class="requirement-date field-input" type="date" aria-label={'Due date for ' + requirement.label} value={requirement.dueDate || ''} onchange={(e) => requirement.dueDate = e.currentTarget.value} /><button class="quiet-icon" aria-label={'Remove ' + requirement.label} onclick={() => application.requirements = application.requirements.filter(r => r.id !== requirement.id)}><X size={14} /></button>{/if}
    </div>
  {/each}
  {#if editable}
    <form class="flex items-center gap-2 mt-3" onsubmit={(e) => { e.preventDefault(); add(); }}>
      <input class="field-input" aria-label="New requirement" placeholder="Add a requirement" bind:value={newItem} />
      <button class="icon-btn" aria-label="Add requirement" disabled={!newItem.trim()}><Plus size={17} /></button>
    </form>
  {/if}
</div>
