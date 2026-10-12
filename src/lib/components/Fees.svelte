<script lang="ts">
  import { Plus, Trash2, Wallet } from 'lucide-svelte';
  import { workspace } from '$lib/workspace.svelte';
  import { currencies, feeTotals, formatMoney, type Currency } from '$lib/model';
  let { applicationId }: { applicationId?: string } = $props();
  let currency = $state<Currency>('USD'), filter = $state('All');
  let selectedFees = $derived(workspace.fees.filter(f => !applicationId || f.applicationId === applicationId));
  let totals = $derived(feeTotals(selectedFees, currency));
  let visible = $derived(selectedFees.filter(f => f.currency === currency && (filter === 'All' || f.paid === (filter === 'Paid'))));
  function addFee() { workspace.fees.push({ id: crypto.randomUUID(), applicationId: applicationId ?? null, label: 'Application fee', amount: 0, currency, paid: false, dueDate: '' }); }
</script>
<div class="fee-toolbar"><div class="filter-tabs">{#each ['All', 'Unpaid', 'Paid'] as item}<button class:active={filter === item} onclick={() => filter = item}>{item}</button>{/each}</div><select class="toolbar-select" aria-label="Fee currency" bind:value={currency}>{#each currencies as value}<option>{value}</option>{/each}</select><button class="secondary-btn" onclick={addFee}><Plus size={15} />Add fee</button></div>
<div class="fee-totals"><div><span>Total</span><strong>{formatMoney(totals.total, currency)}</strong></div><div><span>Paid</span><strong class="paid-total">{formatMoney(totals.paid, currency)}</strong></div><div><span>To pay</span><strong>{formatMoney(totals.unpaid, currency)}</strong></div></div>
<div class="fee-list">
  {#each visible as fee (fee.id)}
    <div class="fee-row">
      <label class="fee-paid"><input type="checkbox" bind:checked={fee.paid} aria-label={'Mark ' + fee.label + ' paid'} /><span>{fee.paid ? 'Paid' : 'Unpaid'}</span></label>
      <div class="fee-fields"><label class="field-label">Fee<input class="field-input" bind:value={fee.label} maxlength="200" /></label><label class="field-label">Amount<input class="field-input" type="number" min="0" max="100000000" step="0.01" value={fee.amount} oninput={(e) => { fee.amount = Math.max(0, Number(e.currentTarget.value) || 0); }} /></label>
      {#if !applicationId}<label class="field-label">Program<select class="field-input" aria-label="Fee program" bind:value={fee.applicationId}><option value={null}>General</option>{#each workspace.applications as app}<option value={app.id}>{app.university}</option>{/each}</select></label>{/if}
      <label class="field-label">Due date<input class="field-input" type="date" bind:value={fee.dueDate} /></label><label class="field-label">Currency<select class="field-input" aria-label={'Currency for ' + fee.label} bind:value={fee.currency}>{#each currencies as value}<option>{value}</option>{/each}</select></label></div>
      <button class="quiet-icon" aria-label={'Remove ' + fee.label} onclick={() => workspace.fees = workspace.fees.filter(f => f.id !== fee.id)}><Trash2 size={15} /></button>
    </div>
  {:else}<div class="empty-state"><Wallet size={25} /><h3>No {filter === 'All' ? '' : filter.toLowerCase() + ' '}fees</h3></div>{/each}
</div>
