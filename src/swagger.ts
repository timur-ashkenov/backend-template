const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Product Store API",
    version: "1.0.0",
    description:
      "REST API to manage products and transactions. CRUD on products and receipt transactions with pre-calculated amount.",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local server",
    },
  ],
  tags: [
    { name: "Products", description: "Operations with products" },
    { name: "Transactions", description: "Operations with transactions" },
  ],
  components: {
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", description: "Product identifier" },
          title: { type: "string", description: "Book's name" },
          author: { type: "string", description: "Author" },
          price: { type: "number", description: "Cost of product" },
          description: { type: "string", description: "Description" },
          stock: { type: "number", description: "Quantity in stock" },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation date",
          },
        },
        required: ["title", "author", "price"],
        example: {
          id: "66d9f2f2c5b7c2f4a1b3d123",
          title: "Мастер и Маргарита",
          author: "Михаил Булгаков",
          price: 1200,
          description: "Культовый роман XX века",
          stock: 5,
          createdAt: "2025-08-17T10:00:00.000Z",
        },
      },
      ProductCreateInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          price: { type: "number" },
          description: { type: "string" },
          stock: { type: "number" },
        },
        required: ["title", "author", "price"],
      },
      ProductUpdateInput: {
        type: "object",
        properties: {
          title: { type: "string" },
          author: { type: "string" },
          price: { type: "number" },
          description: { type: "string" },
          stock: { type: "number" },
        },
        additionalProperties: false,
      },

      Transaction: {
        type: "object",
        properties: {
          id: { type: "string", description: "Transaction identifier" },
          userId: { type: "string", description: "User identifier" },
          amount: { type: "number", description: "Transaction amount" },
          products: {
            type: "array",
            description: "List id of bought products",
            items: { type: "string" },
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation date",
          },
        },
        required: ["userId", "amount", "products"],
        example: {
          id: "66da00a0c5b7c2f4a1b3d999",
          userId: "user123",
          amount: 2500,
          products: ["66d9f2f2c5b7c2f4a1b3d123", "66d9f2f2c5b7c2f4a1b3d456"],
          createdAt: "2025-08-17T10:30:00.000Z",
        },
      },
      TransactionCreateInput: {
        type: "object",
        properties: {
          userId: { type: "string" },
          amount: { type: "number" },
          products: { type: "array", items: { type: "string" } },
        },
        required: ["userId", "amount", "products"],
      },
    },
    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Resurs identifier (ObjectId)",
      },
    },
  },

  paths: {
    // ---------- PRODUCTS ----------
    "/products": {
      get: {
        tags: ["Products"],
        summary: "Get list of all products",
        responses: {
          "200": {
            description: "List of products",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Product" } },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
      post: {
        tags: ["Products"],
        summary: "Create new product",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductCreateInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Product had been created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" },
              },
            },
          },
          "400": { description: "Incorrect data" },
          "500": { description: "Server error" },
        },
      },
    },

    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product by id",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "200": {
            description: "Product found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Product" } },
            },
          },
          "404": { description: "Product not found" },
          "500": { description: "Server error" },
        },
      },
      patch: {
        tags: ["Products"],
        summary: "Update product",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProductUpdateInput" },
            },
          },
        },
        responses: {
          "200": {
            description: "Product had been updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Product" } },
            },
          },
          "404": { description: "Product not found" },
          "500": { description: "Server error" },
        },
      },
      delete: {
        tags: ["Products"],
        summary: "Delete product",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "200": {
            description: "Product had been deleted",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Product" } },
            },
          },
          "404": { description: "Product not found" },
          "500": { description: "Server error" },
        },
      },
    },

    // ---------- TRANSACTIONS ----------
    "/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "Get list of transactions",
        responses: {
          "200": {
            description: "List of transactions",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Transaction" } },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
      post: {
        tags: ["Transactions"],
        summary: "Create transaction",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TransactionCreateInput" },
            },
          },
        },
        responses: {
          "201": {
            description: "Transaction had been created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Transaction" },
              },
            },
          },
          "400": { description: "Incorrect data" },
          "500": { description: "Server error" },
        },
      },
    },
  },
};

export default swaggerSpec;
