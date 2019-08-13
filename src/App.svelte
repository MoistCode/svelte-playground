<script>
  import Navbar from "./Navbar.svelte";
  import Player from "./Player.svelte";
  import AddPlayer from "./AddPlayer.svelte";

  let id = 4;
  let playerLength = 3;

  let players = {
    "1": {
      id: "1",
      name: "John Doe",
      points: 100
    },
    "2": {
      id: "2",
      name: "John Doe",
      points: 100
    },
    "3": {
      id: "3",
      name: "John Doe",
      points: 100
    }
  };

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
  {#if playerLength === 0}
    <p>No Players</p>
  {:else}
    {#each Object.values(players) as player}
      <Player name={player.name} points={player.points} />
    {/each}
  {/if}
</div>
