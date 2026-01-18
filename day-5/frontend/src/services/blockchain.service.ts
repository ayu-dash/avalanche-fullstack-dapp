const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

/**
 * Get latest blockchain value
 */
export async function getBlockchainValue() {
  const res = await fetch(`${BACKEND_URL}/blockchain/value`, {
    method: "GET",
    cache: "no-store", // selalu ambil data terbaru
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blockchain value");
  }

  return res.json();
}

/**
 * Get blockchain events
 */
export async function getBlockchainEvents() {
  const res = await fetch(`${BACKEND_URL}/blockchain/events`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blockchain events");
  }

  return res.json();
}