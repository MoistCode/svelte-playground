<script>
  import Navbar from "./Navbar.svelte";
  import Player from "./Player.svelte";
  import AddPlayer from "./AddPlayer.svelte";

  let players = [
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

  const addPlayer = e => {
    const newPlayer = e.detail;

    players = [...players, newPlayer];
  };
</script>

<style>

</style>

<Navbar />
<div class="container">
  <AddPlayer on:addplayer={addPlayer} />
  {#if players.length === 0}
    <p>No Players</p>
  {:else}
    {#each players as player}
      <Player name={player.name} points={player.points} />
    {/each}
  {/if}
</div>
