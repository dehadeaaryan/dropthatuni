<script lang="ts">
  import { stages, stageOf, isAccepted, isRejected, type Application } from '$lib/model';
  import { Star, Pencil, ClipboardCheck, Send, Search, GraduationCap, Check, X, UsersRound, FileText, Gauge } from 'lucide-svelte';
  let { application, compact = false }: { application: Application; compact?: boolean } = $props();
  let current = $derived(stageOf(application.status));
  const icons = [Star, Pencil, ClipboardCheck, Send, Search, GraduationCap];
  function iconFor(index: number) {
    if (index === 5 && isAccepted(application.status)) return Check;
    if (index === 5 && isRejected(application.status)) return X;
    if (index === current && application.status === 'Awaiting references') return UsersRound;
    if (index === current && application.status === 'Awaiting documents') return FileText;
    if (index === current && application.status === 'Awaiting scores') return Gauge;
    return icons[index];
  }
</script>
<div class="timeline" class:mini={compact} aria-label={application.status}>
  {#each stages as stage, index}
    {@const Icon = iconFor(index)}
    <div class="timeline-stop" class:completed={index < current} class:current={index === current} class:accepted={index === 5 && isAccepted(application.status)} class:rejected={index === 5 && isRejected(application.status)}>
      <span class="timeline-dot" role="img" aria-label={index === current ? application.status : stage} title={index === current ? application.status : stage}>
        <Icon size={compact ? 15 : 13} strokeWidth={1.8} />
      </span>
      {#if !compact}<span class="timeline-label">{stage}</span>{/if}
    </div>
  {/each}
</div>
