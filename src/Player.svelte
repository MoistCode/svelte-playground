<script>
  import { createEventDispatcher } from "svelte";

  export let id = null;
  export let name = "Name not available";
  export let points = 999;

  const dispatch = createEventDispatcher();

  let showControls = false;

  const addPoint = () => (points += 1);
  const removePoint = () => (points -= 1);
  const toggleControls = () => (showControls = !showControls);
  const removePlayer = e => {
    e.preventDefault();

    dispatch("removeplayer", id);
  };
</script>

<style>
  h1 {
    color: #204f2e;
  }

  h3 {
    margin-bottom: 10px;
  }
</style>

<div class="card">
  <h1>
    {name}
    <button class="btn btn-sm" on:click={toggleControls}>
      {#if showControls}-{:else}+{/if}
    </button>
  </h1>
  <h3>Points: {points}</h3>
  {#if showControls}
    <button class="btn" on:click={addPoint}>+1</button>
    <button class="btn btn-dark" on:click={removePoint}>-1</button>
    <button class="btn btn-dark" on:click={removePlayer}>Delete</button>
    <input type="number" bind:value={points} />
  {/if}
</div>
