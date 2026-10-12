<script lang="ts">
  import { Upload, Download, Trash2, FileText, Plus, X } from 'lucide-svelte';
  import { workspace, saveWorkspace, snapshot } from '$lib/workspace.svelte';
  import type { DocumentRecord } from '$lib/model';
  let { applicationId }: { applicationId?: string } = $props();
  let documents = $state<DocumentRecord[]>([]), library = $state<DocumentRecord[]>([]);
  let loading = $state(true), busy = $state(false), message = $state(''), configured = $state(false);
  let attachId = $state(''), deleting = $state<string | null>(null);
  let fileInput = $state<HTMLInputElement>();
  let available = $derived(library.filter(d => !documents.some(existing => existing.id === d.id)));
  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not update documents.');
    return data;
  }
  async function refresh(signal?: AbortSignal) {
    loading = true; message = '';
    try {
      const result = await request('/api/documents' + (applicationId ? '?applicationId=' + encodeURIComponent(applicationId) : ''), { signal });
      documents = result.documents; configured = result.configured;
      if (applicationId) library = (await request('/api/documents', { signal })).documents;
    } catch (cause) { if (!signal?.aborted) message = cause instanceof Error ? cause.message : 'Could not load documents.'; }
    finally { if (!signal?.aborted) loading = false; }
  }
  $effect(() => {
    const userId = workspace.user?.id; const id = applicationId;
    if (userId) { const controller = new AbortController(); void refresh(controller.signal); return () => controller.abort(); }
    documents = []; library = []; loading = false;
  });
  async function upload() {
    const file = fileInput?.files?.[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024 || !file.size) { message = 'Choose a file up to 10 MB.'; if (fileInput) fileInput.value = ''; return; }
    busy = true; message = '';
    try {
      if (!await saveWorkspace(snapshot())) throw new Error('Save your workspace before uploading.');
      const form = new FormData(); form.append('file', file); if (applicationId) form.append('applicationId', applicationId);
      await request('/api/documents', { method: 'POST', body: form }); await refresh();
    } catch (cause) { message = cause instanceof Error ? cause.message : 'Upload failed.'; }
    finally { busy = false; if (fileInput) fileInput.value = ''; }
  }
  async function attach() {
    if (!attachId || !applicationId) return;
    busy = true; message = '';
    try {
      if (!await saveWorkspace(snapshot())) throw new Error('Save your workspace first.');
      await request('/api/documents/' + attachId, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId }) });
      attachId = ''; await refresh();
    } catch (cause) { message = cause instanceof Error ? cause.message : 'Could not attach document.'; }
    finally { busy = false; }
  }
  async function remove(id: string) {
    busy = true; message = '';
    try { await request('/api/documents/' + id + (applicationId ? '?applicationId=' + encodeURIComponent(applicationId) : ''), { method: 'DELETE' }); deleting = null; await refresh(); }
    catch (cause) { message = cause instanceof Error ? cause.message : 'Could not remove document.'; }
    finally { busy = false; }
  }
  const sizeLabel = (size: number) => size >= 1024 * 1024 ? (size / (1024 * 1024)).toFixed(1) + ' MB' : Math.ceil(size / 1024) + ' KB';
</script>
{#if workspace.demo}
  <div class="empty-state"><FileText size={26} /><h3>Documents</h3><p>Log in to upload and attach documents.</p><a class="secondary-btn mt-4" href="/login">Log in</a></div>
{:else if !workspace.user}
  <div class="empty-state"><FileText size={26} /><button class="secondary-btn" onclick={() => workspace.modal = 'profile'}>Log in to add documents</button></div>
{:else}
  <div class="section-heading"><h3>Documents</h3><button class="secondary-btn" disabled={busy || loading || !configured} onclick={() => fileInput?.click()}><Upload size={15} />{busy ? 'Please wait…' : 'Upload'}</button></div>
  <input class="sr-only" type="file" bind:this={fileInput} aria-label="Upload document" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" onchange={() => void upload()} />
  {#if !configured && !loading}<p class="text-xs text-muted mb-4">Document storage needs an R2 documents bucket.</p>{/if}
  {#if loading}<p class="text-xs text-muted py-4">Loading…</p>{:else}
    <div class="document-list">
      {#each documents as document (document.id)}
        <div class="document-row"><FileText size={19} class="text-muted shrink-0" /><div class="min-w-0 flex-1"><strong>{document.name}</strong><small>{sizeLabel(document.size)}</small></div><a class="quiet-icon" href={'/api/documents/' + document.id} aria-label={'Download ' + document.name} download><Download size={16} /></a><button class="quiet-icon" disabled={busy} aria-label={(applicationId ? 'Detach ' : 'Delete ') + document.name} onclick={() => applicationId ? void remove(document.id) : deleting = document.id}>{#if applicationId}<X size={15} />{:else}<Trash2 size={15} />{/if}</button></div>
        {#if deleting === document.id}<div class="delete-confirm"><span>Delete this document?</span><button class="text-btn" disabled={busy} onclick={() => deleting = null}>Cancel</button><button class="text-btn danger-text" disabled={busy} onclick={() => void remove(document.id)}>Delete</button></div>{/if}
      {:else}<p class="text-xs text-muted py-5">No documents</p>{/each}
    </div>
    {#if applicationId && available.length}<form class="flex gap-2 mt-5" onsubmit={(e) => { e.preventDefault(); void attach(); }}><select class="field-input" aria-label="Document from library" bind:value={attachId}><option value="">From your library…</option>{#each available as document}<option value={document.id}>{document.name}</option>{/each}</select><button class="icon-btn" disabled={!attachId || busy} aria-label="Attach document"><Plus size={17} /></button></form>{/if}
  {/if}
  {#if message}<p class="form-error mt-3" role="alert">{message}</p>{/if}
{/if}
