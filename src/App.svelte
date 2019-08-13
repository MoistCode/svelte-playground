<script>
  import Navbar from "./Navbar.svelte";
  import Player from "./Player.svelte";

  const players = [];
</script>

<style>

</style>

<Navbar />
<div class="container">
  {#if players.length === 0}
    <p>No Players</p>
  {:else}
    {#each players as player}
      <Player />
    {/each}
  {/if}
</div>
