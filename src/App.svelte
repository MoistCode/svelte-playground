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
      name: "Moist Code",
      points: 6969
    },
    "3": {
      id: "3",
      name: "Cow Man",
      points: 100
    }
  };

  const addPlayer = e => {
    const newPlayer = e.detail;

    players = {
      ...players,
      [String(id)]: newPlayer
    };

    id += 1;
    playerLength += 1;
  };

  const removePlayer = e => {
    const playerId = e.detail;
    const tempPlayers = JSON.parse(JSON.stringify(players));

    delete tempPlayers[playerId];

    players = tempPlayers;

    playerLength -= 1;
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
      <Player
        name={player.name}
        points={player.points}
        id={player.id}
        on:removeplayer={removePlayer} />
    {/each}
  {/if}
</div>
