#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String,
};

const TTL_THRESHOLD: u32 = 518_400;
const TTL_EXTEND_TO: u32 = 1_555_200;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub payment_hash: String,
    pub ledger: u32,
}

#[contracttype]
enum DataKey {
    Count,
    Payment(u64),
    PaymentHash(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    InvalidAmount = 1,
    DuplicatePayment = 2,
}

#[contractevent(data_format = "vec")]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRecorded {
    #[topic]
    pub id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub amount: i128,
    pub payment_hash: String,
}

#[contract]
pub struct LumenPayTracker;

#[contractimpl]
impl LumenPayTracker {
    pub fn record_payment(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
        payment_hash: String,
    ) -> Result<u64, ContractError> {
        sender.require_auth();
        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let hash_key = DataKey::PaymentHash(payment_hash.clone());
        if env.storage().persistent().has(&hash_key) {
            return Err(ContractError::DuplicatePayment);
        }

        let count_key = DataKey::Count;
        let id = env.storage().persistent().get(&count_key).unwrap_or(0_u64) + 1;
        let payment_key = DataKey::Payment(id);
        let payment = Payment {
            id,
            sender: sender.clone(),
            recipient: recipient.clone(),
            amount,
            payment_hash: payment_hash.clone(),
            ledger: env.ledger().sequence(),
        };

        env.storage().persistent().set(&count_key, &id);
        env.storage().persistent().set(&payment_key, &payment);
        env.storage().persistent().set(&hash_key, &id);
        env.storage()
            .persistent()
            .extend_ttl(&count_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .persistent()
            .extend_ttl(&payment_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .persistent()
            .extend_ttl(&hash_key, TTL_THRESHOLD, TTL_EXTEND_TO);

        PaymentRecorded {
            id,
            sender,
            recipient,
            amount,
            payment_hash,
        }
        .publish(&env);
        Ok(id)
    }

    pub fn get_payment(env: Env, id: u64) -> Option<Payment> {
        let key = DataKey::Payment(id);
        let payment = env.storage().persistent().get(&key);
        if payment.is_some() {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        payment
    }

    pub fn get_payment_count(env: Env) -> u64 {
        let key = DataKey::Count;
        let count = env.storage().persistent().get(&key).unwrap_or(0_u64);
        if count > 0 {
            env.storage()
                .persistent()
                .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        }
        count
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup() -> (Env, LumenPayTrackerClient<'static>, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(LumenPayTracker, ());
        let client = LumenPayTrackerClient::new(&env, &contract_id);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);
        (env, client, sender, recipient)
    }

    #[test]
    fn records_and_reads_payment() {
        let (env, client, sender, recipient) = setup();
        let hash = String::from_str(&env, "abc123");

        let id = client.record_payment(&sender, &recipient, &25_000_000_i128, &hash);

        assert_eq!(id, 1);
        assert_eq!(client.get_payment_count(), 1);
        let payment = client.get_payment(&id).unwrap();
        assert_eq!(payment.sender, sender);
        assert_eq!(payment.recipient, recipient);
        assert_eq!(payment.amount, 25_000_000_i128);
        assert_eq!(payment.payment_hash, hash);
    }

    #[test]
    fn increments_ids_for_distinct_payments() {
        let (env, client, sender, recipient) = setup();
        let first = String::from_str(&env, "hash-1");
        let second = String::from_str(&env, "hash-2");

        assert_eq!(
            client.record_payment(&sender, &recipient, &10_i128, &first),
            1
        );
        assert_eq!(
            client.record_payment(&sender, &recipient, &20_i128, &second),
            2
        );
        assert_eq!(client.get_payment_count(), 2);
    }

    #[test]
    fn missing_payment_returns_none() {
        let (_env, client, _sender, _recipient) = setup();
        assert_eq!(client.get_payment(&999), None);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #1)")]
    fn rejects_non_positive_amount() {
        let (env, client, sender, recipient) = setup();
        let hash = String::from_str(&env, "invalid-amount");
        client.record_payment(&sender, &recipient, &0_i128, &hash);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #2)")]
    fn rejects_duplicate_payment_hash() {
        let (env, client, sender, recipient) = setup();
        let hash = String::from_str(&env, "same-hash");
        client.record_payment(&sender, &recipient, &10_i128, &hash);
        client.record_payment(&sender, &recipient, &10_i128, &hash);
    }
}
