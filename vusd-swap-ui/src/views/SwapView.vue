<template>
    <div class="swap-container">
      <h1>Swap Tokens</h1>
  
      <input v-model="amount" type="text" placeholder="Enter amount" />
  
      <button @click="swapTokens" :disabled="loading">
        {{ loading ? "Swapping..." : "Swap" }}
      </button>
  
      <p v-if="message">{{ message }}</p>
      <p v-if="transactionHash">
        View on Explorer: 
        <a :href="explorerUrl" target="_blank">{{ transactionHash }}</a>
      </p>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import axios from "axios";
  
  const amount = ref("");
  const message = ref("");
  const transactionHash = ref("");
  const loading = ref(false);
  
  const explorerUrl = computed(() =>
    transactionHash.value
      ? `https://dashboard.tenderly.co/deiva/project/testnet/44df88ec-b290-48a5-a24a-0b3ca3b1a969/tx/polygon-amoy/${transactionHash.value}`
      : ""
  );
  
  const swapTokens = async () => {
    try {
      loading.value = true;
      message.value = "";
      transactionHash.value = "";
  
      const response = await axios.post("http://localhost:3002/swap", {
        amount: amount.value,
        depositor: "0xA70afB10B1664066a74dd7de632Ff5F8b9881B28"
      });
  
      transactionHash.value = response.data.transaction;
      message.value = "Swap successful!";
    } catch (error) {
      console.error("Swap Error:", error);
      message.value = "Swap failed. Check console for details.";
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
.swap-container {
    text-align: center;
    padding: 20px;
}

input {
    padding: 8px;
    margin-bottom: 12px;
    margin-right: 10px;
    width: 300px;
    border: 1px solid #ccc;
    outline: none;
}

button {
    padding: 8px 12px;
    background-color: #41a39b;
    color: white;
    border: none;
    cursor: pointer;
    transition: background 0.3s ease-in-out;
}

button:hover {
    background-color: #0e6860;
}

button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}

p {
    margin-top: 10px;
}

.success {
    color: green;
}

.error {
    color: red;
}

a {
    color: #41a39b;
    text-decoration: none;
    font-weight: bold;
}

a:hover {
    text-decoration: underline;
}
</style>

  