<script lang="ts">
  import { statuses, stages, type ApplicationDraft } from '$lib/model';
  let { value = $bindable(), identity = false }: { value: ApplicationDraft; identity?: boolean } = $props();
</script>

{#if identity}
  <section class="program-form-section" aria-label="Program identity">
    <div class="section-heading"><h3>Program</h3><span class="text-xs text-muted">Required</span></div>
    <label class="field-label">University<input class="field-input" name="university" required maxlength="150" placeholder="e.g. University of Edinburgh" autocomplete="off" bind:value={value.university} /></label>
    <label class="field-label">Program<input class="field-input" required maxlength="150" placeholder="e.g. MSc Computer Science" bind:value={value.program} /></label>
  </section>
{/if}
<section class="program-form-section" aria-label="Application details">
  <div class="section-heading"><h3>Application details</h3>{#if identity}<span class="text-xs text-muted">Optional</span>{/if}</div>
  <div class="field-grid">
    <label class="field-label">Intake<input class="field-input" maxlength="80" bind:value={value.intake} placeholder="e.g. September 2027" /></label>
    <label class="field-label">Location<input class="field-input" maxlength="200" bind:value={value.location} placeholder="City, country" /></label>
    <label class="field-label">Status<select class="field-input" aria-label="Status" bind:value={value.status}>{#each stages as stage, i}<optgroup label={stage}>{#each statuses.filter(status => status.stage === i) as status}<option>{status.label}</option>{/each}</optgroup>{/each}</select></label>
    <label class="field-label">Application deadline<input class="field-input" type="date" bind:value={value.deadline} /></label>
  </div>
</section>
<details class="program-links" open={!identity}>
  <summary>Links<span class="text-xs text-muted">Program page & application portal</span></summary>
  <div class="program-form-section">
    <label class="field-label">Official program page<input class="field-input" type="url" maxlength="2000" bind:value={value.sourceUrl} placeholder="https://university.edu/program" /></label>
    <label class="field-label">Application link<input class="field-input" type="url" aria-label="Application link" maxlength="2000" bind:value={value.applicationUrl} placeholder="https://apply.university.edu" /></label>
  </div>
</details>
