process.env.Node_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

const testBook = {
    isbn: "0691161518",
    amazon_url: "http://a.co/eobPtX2",
    author: "Matthew Lane",
    language: "english",
    pages: 264,
    publisher: "Princeton University Press",
    title: "Power-Up: Unlocking the Hidden Mathematics in Video Games",
    year: 2017
};

beforeEach(async () => {
    await db.query("DELETE FROM books");
    await Book.create(testBook); 
});

afterEach(async () => {
    await db.query("DELETE FROM books");
});

afterAll(async () => {
    await db.end();
});

describe("GET /books", () => {
    test("Gets a list of all the books", async () => {
        const response = await request(app).get("/books");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ books: [testBook] });
    });
});

describe("POST /books", () => {
    test("Creates a book with valid data", async () => {
        const newBook = {
            isbn: "0123456789",
            amazon_url: "http://a.co/newbook",
            author: "New Author",
            language: "english",
            pages: 200,
            publisher: "New Publisher",
            title: "New Book",
            year: 2023
        };
        const response = await request(app)
            .post("/books")
            .send(newBook);
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toEqual(newBook);
    });

    test("Fails with invalid amazon_url", async () => {
        const bookWithInvalidAmazonUrl = { ...testBook, amazon_url: "not-a-valid-url" };
        const response = await request(app)
            .post("/books")
            .send(bookWithInvalidAmazonUrl);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("instance.amazon_url does not conform to the \"uri\" format");
    });

    test("Fails with missing required field", async () => {
        const { publisher, ...bookWithoutPublisher } = testBook;
        const response = await request(app)
            .post("/books")
            .send(bookWithoutPublisher);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("instance requires property \"publisher\"");
    });

    test("Fails with invalid type for 'pages' and 'year'", async () => {
        const bookWithInvalidTypes = {
            ...testBook,
            pages: "three hundred",
            year: "two thousand seventeen"
        };
        const response = await request(app)
            .post("/books")
            .send(bookWithInvalidTypes);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toEqual(
            expect.arrayContaining([
                expect.stringContaining("instance.pages is not of a type(s) integer"),
                expect.stringContaining("instance.year is not of a type(s) integer")
            ])
        );
    });
});

describe("GET /books/:isbn", () => {
    test("Gets a single book by isbn", async () => {
        const response = await request(app).get(`/books/${testBook.isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(testBook.isbn);
    });

    test("Responds with 404 if isbn is invalid", async () => {
        const response = await request(app).get("/books/invalid-isbn");
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toContain("There is no book with an isbn 'invalid-isbn'");
    });
});

describe("PUT /books/:isbn", () => {
    test("Updates a book with valid data", async () => {
        const updatedBook = {
            ...testBook,
            author: "Updated Author",
            publisher: "Updated Publisher",
            title: "Updated Title",
            year: 2024
        };

        const response = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send(updatedBook);

        expect(response.statusCode).toBe(200);
        expect(response.body.book.author).toBe("Updated Author");
        expect(response.body.book.publisher).toBe("Updated Publisher");
    });

    test("Fails with invalid amazon_url", async () => {
        const bookWithInvalidUrl = {
            ...testBook,
            amazon_url: "not-a-valid-url"
        };

        const response = await request(app)
            .put(`/books/${testBook.isbn}`)
            .send(bookWithInvalidUrl);
        expect(response.statusCode).toBe(400);
        expect(response.body.message).toContain("instance.amazon_url does not conform to the \"uri\" format");
    });

    test("Responds with 404 if book does not exist", async () => {
        const response = await request(app).put("/books/invalid-isbn").send(testBook);
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toContain("There is no book with an isbn 'invalid-isbn'");
    });
});

describe("DELETE /books/:isbn", () => {
    test("Deletes a book by isbn", async () => {
        const response = await request(app).delete(`/books/${testBook.isbn}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: "Book deleted" });
    });

    test("Responds with 404 if book does not exist", async () => {
        const response = await request(app).delete("/books/invalid-isbn");
        expect(response.statusCode).toBe(404);
        expect(response.body.message).toContain("There is no book with an isbn 'invalid-isbn'");
    });
});

