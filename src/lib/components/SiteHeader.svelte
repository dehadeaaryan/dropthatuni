<script lang="ts">
  import { Sun, Moon } from 'lucide-svelte';
  import { workspace, toggleTheme, saveWorkspace, snapshot } from '$lib/workspace.svelte';
  import Profile from './Profile.svelte';
  async function visit(event: MouseEvent, path: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!workspace.user || await saveWorkspace(snapshot())) window.location.assign(path);
  }
</script>
<header class="site-header" inert={!workspace.loaded}>
  <div class="header-pill glass">
    <a class="brand" href="/" onclick={(e) => void visit(e, '/')} aria-label="DropThatUni home"><img class="brand-logo" src="/logo.png" alt="" width="42" height="42" /><span>DropThatUni<span class="text-accent">.</span></span></a>
    <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
      <a class="header-link" href="/import" onclick={(e) => void visit(e, '/import')}>Import</a>
      <a class="header-link" href="/about" onclick={(e) => void visit(e, '/about')}>About</a>
      <button class="icon-btn theme-btn" aria-label={workspace.dark ? 'Switch to light theme' : 'Switch to dark theme'} onclick={toggleTheme}>{#if workspace.dark}<Sun size={18} />{:else}<Moon size={18} />{/if}</button>
      <Profile />
    </nav>
  </div>
</header>
