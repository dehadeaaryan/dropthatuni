<script lang="ts">
  import { safeLink, type Field, type FieldValue } from '$lib/model';
  import { ExternalLink } from 'lucide-svelte';
  let { field, value = $bindable(), compact = false }: { field: Field; value: FieldValue | undefined; compact?: boolean } = $props();
</script>
{#if field.type === 'checkbox'}
  <label class="flex items-center gap-2 min-h-10">
    <input type="checkbox" aria-label={field.label} checked={!!value} onchange={(e) => value = e.currentTarget.checked} />
    {#if !compact}<span class="text-sm text-muted">{value ? 'Yes' : 'No'}</span>{/if}
  </label>
{:else if field.type === 'select'}
  <select aria-label={field.label} class:cell-input={compact} class="field-input" value={String(value ?? '')} onchange={(e) => value = e.currentTarget.value}>
    <option value="">Select…</option>
    {#each field.options as option}<option value={option}>{option}</option>{/each}
  </select>
{:else if field.type === 'textarea' && !compact}
  <textarea class="field-input resize-y" rows="3" aria-label={field.label} value={String(value ?? '')} oninput={(e) => value = e.currentTarget.value} placeholder="Add notes…"></textarea>
{:else}
  <div class="flex items-center gap-2 min-w-0">
    <input class="field-input" class:cell-input={compact} aria-label={field.label} type={field.type === 'textarea' ? 'text' : field.type === 'url' ? 'url' : field.type} value={value === undefined ? '' : String(value)} oninput={(e) => value = field.type === 'number' && e.currentTarget.value !== '' ? Number(e.currentTarget.value) : e.currentTarget.value} placeholder={field.type === 'url' ? 'https://' : '—'} />
    {#if field.type === 'url' && safeLink(value)}<a class="icon-btn shrink-0" aria-label={'Open ' + field.label} href={safeLink(value)} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a>{/if}
  </div>
{/if}
