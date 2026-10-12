<script lang="ts">
  import { workspace } from '$lib/workspace.svelte';
  import { validTimezone } from '$lib/model';
  let configured = $state<boolean | null>(null), timezone = $state(workspace.reminders.timezone), message = $state('');
  $effect(() => {
    const controller = new AbortController();
    fetch('/api/reminders/settings', { signal: controller.signal }).then(r => r.ok ? r.json() : Promise.reject()).then(data => configured = data.configured).catch(() => { if (!controller.signal.aborted) configured = false; });
    return () => controller.abort();
  });
  function changeTimezone() {
    if (validTimezone(timezone)) { workspace.reminders.timezone = timezone; message = ''; }
    else message = 'Enter an IANA time zone, such as America/Los_Angeles.';
  }
  function toggleDay(day: number, checked: boolean) {
    const days = checked ? [...workspace.reminders.days, day] : workspace.reminders.days.filter(d => d !== day);
    if (!days.length) { message = 'Choose at least one reminder day.'; return; }
    workspace.reminders.days = [...new Set(days)].sort((a, b) => b - a); message = '';
  }
</script>
<div class="section-heading mt-7"><h3>Deadline reminders</h3></div>
<label class="flex items-center gap-3 text-sm mb-5"><input type="checkbox" bind:checked={workspace.reminders.enabled} />Email reminders</label>
{#if configured === false}<p class="text-xs text-muted mb-4">Email delivery needs server configuration.</p>{/if}
<div class="field-grid">
<label class="field-label">Time zone<input class="field-input" bind:value={timezone} onchange={changeTimezone} /></label>
<label class="field-label">Daily check<select class="field-input" aria-label="Reminder hour" bind:value={workspace.reminders.hour}>{#each Array.from({ length: 24 }, (_, i) => i) as hour}<option value={hour}>{String(hour).padStart(2, '0')}:00</option>{/each}</select></label>
</div>
<div class="flex gap-4 flex-wrap mt-5 text-xs">{#each [14, 7, 3, 1, 0] as day}<label class="flex items-center gap-2"><input type="checkbox" checked={workspace.reminders.days.includes(day)} onchange={(e) => toggleDay(day, e.currentTarget.checked)} />{day ? day + ' days before' : 'On deadline'}</label>{/each}</div>
{#if message}<p class="form-error mt-3" role="alert">{message}</p>{/if}

