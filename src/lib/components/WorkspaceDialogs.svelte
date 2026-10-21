<script lang="ts">
  import { Plus, ChevronUp, ChevronDown } from 'lucide-svelte';
  import { workspace, addField } from '$lib/workspace.svelte';
  import { presets, fieldTypes, type FieldType } from '$lib/model';
  import Dialog from './Dialog.svelte';
  import AddProgram from './AddProgram.svelte';
  let label = $state(''), type = $state<FieldType>('text'), options = $state('');
  function createField() {
    if (!label.trim()) return;
    addField({ label: label.trim(), type, options: [...new Set(options.split(',').map(v => v.trim()).filter(Boolean))] });
    label = ''; options = ''; type = 'text';
  }
  function moveField(index: number, direction: number) {
    const next = [...workspace.fields], target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]; workspace.fields = next;
  }
</script>
{#if workspace.modal === 'add'}
  <AddProgram />
{:else if workspace.modal === 'fields'}
  <Dialog title="Fields & columns" close={() => workspace.modal = null}>
    <div class="dialog-content">
      <div class="section-heading"><h3>Your fields</h3><span class="text-xs text-muted">Show in table</span></div>
      <div class="field-list">
        {#each workspace.fields as field, i (field.id)}
          <div class="field-list-row"><div class="flex-1 min-w-0"><input class="check-label font-semibold" aria-label="Field name" bind:value={field.label} /><span class="text-xs text-muted block">{fieldTypes.find(t => t.value === field.type)?.label}</span></div><button class="quiet-icon" disabled={i === 0} aria-label={'Move ' + field.label + ' up'} onclick={() => moveField(i, -1)}><ChevronUp size={14} /></button><button class="quiet-icon" disabled={i === workspace.fields.length - 1} aria-label={'Move ' + field.label + ' down'} onclick={() => moveField(i, 1)}><ChevronDown size={14} /></button><input type="checkbox" aria-label={'Show ' + field.label + ' column'} bind:checked={field.visible} /></div>
        {/each}
      </div>
      <div class="section-heading mt-7"><h3>Predefined</h3></div>
      <div class="flex gap-2 flex-wrap">{#each presets.filter(p => !workspace.fields.some(f => f.label === p.label)) as preset}<button class="preset-btn" onclick={() => addField(preset)}><Plus size={13} />{preset.label}</button>{/each}</div>
      <form class="grid gap-4 mt-7 border-t border-line pt-5" onsubmit={(e) => { e.preventDefault(); createField(); }}>
        <h3 class="text-sm font-bold">Custom field</h3>
        <div class="field-grid"><label class="field-label">Name<input class="field-input" required bind:value={label} placeholder="Field name" maxlength="60" /></label><label class="field-label">Type<select class="field-input" aria-label="Type" bind:value={type}>{#each fieldTypes as item}<option value={item.value}>{item.label}</option>{/each}</select></label></div>
        {#if type === 'select'}<label class="field-label">Options<input class="field-input" required bind:value={options} placeholder="Option one, option two" /></label>{/if}
        <button class="secondary-btn justify-center"><Plus size={15} />Add field</button>
      </form>
    </div>
  </Dialog>
{/if}
