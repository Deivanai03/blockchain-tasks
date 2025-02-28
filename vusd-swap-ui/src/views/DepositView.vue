<template>
    <div class="container">
        <h1>Deposit Tokens</h1>

        <form @submit.prevent="depositTokens">
            <input v-model="amount" type="number" id="amount" placeholder="Enter amount" required />
            <button type="submit" :disabled="loading">
                {{ loading ? "Processing..." : "Deposit" }}
            </button>
        </form>

        <p v-if="transactionHash" class="success">
            Deposit Successful! Transaction Hash: <br />
            <a :href="explorerUrl" target="_blank">{{ transactionHash }}</a>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script>
import axios from "axios";
import { ref, computed } from "vue";

export default {
    setup() {
        const amount = ref("");
        const transactionHash = ref("");
        const error = ref("");
        const loading = ref(false);

        const explorerUrl = computed(() =>
            transactionHash.value ? `https://dashboard.tenderly.co/deiva/project/testnet/44df88ec-b290-48a5-a24a-0b3ca3b1a969/tx/polygon-amoy/${transactionHash.value}` : ""
        );

        const depositTokens = async () => {
            if (!amount.value || parseFloat(amount.value) <= 0) {
                error.value = "Please enter a valid amount!";
                return;
            }

            try {
                loading.value = true;
                const response = await axios.post("http://localhost:3002/deposit", { amount: amount.value.toString() }); 
                transactionHash.value = response.data.transaction;
                error.value = "";
            } catch (err) {
                console.error("Deposit error:", err);
                error.value = err.response?.data?.error || "Deposit failed!";
                transactionHash.value = "";
            } finally {
                loading.value = false;
            }
        };


        return { amount, depositTokens, transactionHash, error, loading, explorerUrl };
    },
};
</script>

<style scoped>
.container {
    text-align: center;
    padding: 20px;
}

form {
    margin-bottom: 20px;
}

input {
    padding: 8px;
    margin-right: 10px;
    width: 300px;
    border: 1px solid #ccc;
}

button {
    padding: 8px 12px;
    background-color: #41a39b;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #0e6860;
}

button:disabled {
    background-color: #ccc;
}

.success {
    color: green;
    margin-top: 10px;
}

.error {
    color: red;
    margin-top: 10px;
}
</style>