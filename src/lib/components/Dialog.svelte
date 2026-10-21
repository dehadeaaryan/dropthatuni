<script lang="ts">
  import type { Snippet } from 'svelte';
  import { X } from 'lucide-svelte';
  let { title, close, children, drawer = false, initialFocus }: { title: string; close: () => void; children: Snippet; drawer?: boolean; initialFocus?: string } = $props();
  let dialog = $state<HTMLDialogElement>();
  $effect(() => {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    if (initialFocus) dialog.querySelector<HTMLElement>(initialFocus)?.focus();
  });
</script>
<dialog bind:this={dialog} class="dialog glass" class:drawer oncancel={(e) => { e.preventDefault(); close(); }} onclick={(e) => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }} aria-label={title}>
  <div class="dialog-top"><h2>{title}</h2><button class="icon-btn" aria-label="Close" onclick={close}><X size={20} /></button></div>
  {@render children()}
</dialog>
