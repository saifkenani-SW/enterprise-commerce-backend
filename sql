DELETE FROM inventories;
DELETE FROM order_items;
DELETE FROM payments;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM users;

INSERT INTO users (id, "fullName", email, password) VALUES
('10000000-0000-4000-8000-000000000001', 'Admin', 'admin@test.com', '$2b$10$dVsQpednnL4DYAeJ2zWEzeam9cCkdvEkt4IFudTQIqhcFeLmqZBEG'),
('10000000-0000-4000-8000-000000000002', 'User1', 'user1@test.com', '$2b$10$dVsQpednnL4DYAeJ2zWEzeam9cCkdvEkt4IFudTQIqhcFeLmqZBEG');

INSERT INTO products (id, name, description, price, status) VALUES
('20000000-0000-4000-8000-000000000001', 'MacBook Pro', 'Laptop', 1299.99, 'ACTIVE'),
('20000000-0000-4000-8000-000000000002', 'iPhone 16', 'Phone', 1099.99, 'ACTIVE');

INSERT INTO inventories (id, "productId", quantity, version) VALUES
(uuid_generate_v4(), '20000000-0000-4000-8000-000000000001', 10000, 0),
(uuid_generate_v4(), '20000000-0000-4000-8000-000000000002', 10000, 0);

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;