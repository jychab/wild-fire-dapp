import Typesense from "typesense";

export const typeSenseClient = new Typesense.SearchClient({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_CLUSTER as string, // where xxx is the ClusterID of your Typesense Cloud cluster
      port: 443,
      protocol: "https",
    },
  ],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY as string,
  connectionTimeoutSeconds: 2,
});
