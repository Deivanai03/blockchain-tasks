<template>
    <div class="withdraw-container">
      <h1>Withdraw Tokens</h1>
  
      <button @click="withdrawTokens" :disabled="loading">
        {{ loading ? "Withdrawing..." : "Withdraw" }}
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
  
  const message = ref("");
  const transactionHash = ref("");
  const loading = ref(false);
  
  const explorerUrl = computed(() =>
    transactionHash.value
      ? `https://dashboard.tenderly.co/deiva/project/testnet/44df88ec-b290-48a5-a24a-0b3ca3b1a969/tx/polygon-amoy/${transactionHash.value}`
      : ""
  );
  
  const withdrawTokens = async () => {
    try {
      loading.value = true;
      message.value = "";
      transactionHash.value = "";
  
      const response = await axios.post("http://localhost:3002/withdraw");
  
      transactionHash.value = response.data.transaction;
      message.value = "Withdraw successful!";
    } catch (error) {
      console.error("Withdraw Error:", error);
      message.value = "Withdraw failed. Please check console for details.";
    } finally {
      loading.value = false;
    }
  };
  </script>
  
  <style scoped>
  .withdraw-container {
      text-align: center;
      padding: 20px;
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
  
  