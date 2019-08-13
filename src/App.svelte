<script>
  import Navbar from "./Navbar.svelte";
  import Player from "./Player.svelte";

  const players = [
    {
      name: "John Doe",
      points: 100
    },
    {
      name: "Timmy Turner",
      points: 100
    },
    {
      name: "Jack Boo",
      points: 100
    }
  ];
</script>

<style>

</style>

<Navbar />
<div class="container">
  {#if players.length === 0}
    <p>No Players</p>
  {:else}
    {#each players as player}
      <Player name={player.name} points={player.points} />
    {/each}
  {/if}
</div>
