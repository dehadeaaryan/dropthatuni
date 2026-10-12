<script lang="ts">
  import { workspace } from '$lib/workspace.svelte';
  import { newOffer, statuses, currencies, formatMoney, type Offer } from '$lib/model';
  let { applicationId }: { applicationId: string } = $props();
  let app = $derived(workspace.applications.find(a => a.id === applicationId)!);
  $effect(() => { if (!app.offer) app.offer = newOffer(); });
  let offer = $derived(app.offer);
  const amounts = [{ key: 'tuition', label: 'Tuition' }, { key: 'scholarship', label: 'Scholarship' }, { key: 'financialAid', label: 'Financial aid' }, { key: 'deposit', label: 'Deposit' }] as const;
</script>
{#if offer}
<div class="field-grid">
  <label class="field-label">Status<select class="field-input" aria-label="Decision status" bind:value={app.status}>{#each statuses as status}<option>{status.label}</option>{/each}</select></label>
  <label class="field-label">Offer received<input class="field-input" type="date" bind:value={offer.receivedDate} /></label>
  <label class="field-label">Respond by<input class="field-input" type="date" bind:value={offer.responseDeadline} /></label>
  <label class="field-label">Currency<select class="field-input" bind:value={offer.currency}>{#each currencies as c}<option>{c}</option>{/each}</select></label>
  {#each amounts as item}<label class="field-label">{item.label}<input class="field-input" aria-label={item.label} type="number" min="0" max="100000000" step="0.01" value={offer[item.key]} oninput={(e) => offer![item.key] = Math.max(0, Math.min(1e8, Number(e.currentTarget.value) || 0))} /></label>{/each}
  <label class="field-label">Deposit due<input class="field-input" type="date" bind:value={offer.depositDeadline} /></label>
  <label class="field-label">Funding status<select class="field-input" bind:value={offer.fundingStatus}>{#each ['Not applied', 'Applying', 'Applied', 'Awarded', 'Declined'] as status}<option value={status as Offer['fundingStatus']}>{status}</option>{/each}</select></label>
  <label class="field-label">Funding deadline<input class="field-input" type="date" bind:value={offer.fundingDeadline} /></label>
  <label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={offer.depositPaid} />Deposit paid</label>
  <label class="field-label full-width">Funding notes<textarea class="field-input" rows="3" maxlength="10000" bind:value={offer.notes}></textarea></label>
</div>
<div class="offer-total"><span>Tuition after funding</span><strong>{formatMoney(Math.max(0, offer.tuition - offer.scholarship - offer.financialAid), offer.currency)}</strong></div>
{/if}
