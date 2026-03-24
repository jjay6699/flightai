export type AirlineMeta = {
  name: string | null;
  logo: string | null;
};

export async function fetchAirlineMeta(code: string): Promise<AirlineMeta> {
  const res = await fetch(`/api/airline?code=${encodeURIComponent(code)}`);
  const data = await res.json();

  return {
    name: data?.name ?? null,
    logo: data?.logo ?? null
  };
}
