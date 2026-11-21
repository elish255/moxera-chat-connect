import { createFileRoute } from "@tanstack/react-router";
import { receiveSpringTechDelivery } from "@/lib/springtech-delivery.server";

export const Route = createFileRoute("/api/springtech/delivery")({
  server: {
    handlers: {
      POST: ({ request }) => receiveSpringTechDelivery(request),
      GET: ({ request }) => receiveSpringTechDelivery(request),
      PUT: ({ request }) => receiveSpringTechDelivery(request),
      PATCH: ({ request }) => receiveSpringTechDelivery(request),
      DELETE: ({ request }) => receiveSpringTechDelivery(request),
      HEAD: ({ request }) => receiveSpringTechDelivery(request),
    },
  },
});
