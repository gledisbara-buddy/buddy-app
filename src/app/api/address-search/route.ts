import { NextRequest, NextResponse } from "next/server";

type GeoapifyFeature = {
  properties: {
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    name?: string;
    lat?: number;
    lon?: number;
  };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Address search is not configured." }, { status: 500 });
  }

  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query);
  url.searchParams.set("filter", "countrycode:se");
  url.searchParams.set("limit", "5");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "Address search failed." }, { status: 502 });
  }

  const data: { features: GeoapifyFeature[] } = await res.json();
  const results = data.features
    .map((f) => {
      const street = f.properties.street ?? f.properties.name ?? "";
      const adress = f.properties.housenumber ? `${street} ${f.properties.housenumber}` : street;
      return {
        adress,
        postnummer: f.properties.postcode ?? "",
        ort: f.properties.city ?? "",
        lat: f.properties.lat,
        lon: f.properties.lon,
      };
    })
    .filter((r) => r.adress);

  return NextResponse.json({ results });
}
