const { sequelize } = require('../config/database');

const User = require('./user.model');
const Category = require('./category.model');
const Product = require('./product.model');
const Customer = require('./customer.model');
const Address = require('./address.model');
const Cart = require('./cart.model');
const CartItem = require('./cart_item.model');
const Order = require('./order.model');
const OrderItem = require('./order_item.model');
const OrderMessage = require('./order_message.model');
const Payment = require('./payment.model');
const Review = require('./review.model');
const SupportTicket = require('./support_ticket.model');
const Udhaar = require('./udhaar.model');
const Route = require('./route.model');
const Notification = require('./notification.model');
const VoiceCommand = require('./voice_command.model');

// Vendor -> Products
User.hasMany(Product, { foreignKey: 'vendorId', as: 'products', onDelete: 'CASCADE' });
Product.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryInfo' });

// Customer User -> Saved Addresses
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Customer User -> Cart -> CartItems
User.hasOne(Cart, { foreignKey: 'userId', as: 'cart', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Cart.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

Cart.hasMany(CartItem, { foreignKey: 'cartId', as: 'items', onDelete: 'CASCADE' });
CartItem.belongsTo(Cart, { foreignKey: 'cartId', as: 'cart' });
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Vendor CRM Customers
User.hasMany(Customer, { foreignKey: 'vendorId', as: 'customers', onDelete: 'CASCADE' });
Customer.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

// Orders
User.hasMany(Order, { foreignKey: 'vendorId', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

User.hasMany(Order, { foreignKey: 'customerUserId', as: 'customerOrders' });
Order.belongsTo(User, { foreignKey: 'customerUserId', as: 'customerUser' });

Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Order Messages (Real-time Customer <-> Vendor communication)
Order.hasMany(OrderMessage, { foreignKey: 'orderId', as: 'messages', onDelete: 'CASCADE' });
OrderMessage.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
OrderMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Reviews
Order.hasOne(Review, { foreignKey: 'orderId', as: 'review', onDelete: 'CASCADE' });
Review.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Review.belongsTo(User, { foreignKey: 'customerUserId', as: 'customer' });
Review.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
User.hasMany(Review, { foreignKey: 'vendorId', as: 'reviews' });

// Support Tickets
User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets', onDelete: 'CASCADE' });
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SupportTicket.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
SupportTicket.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

// Payments
User.hasMany(Payment, { foreignKey: 'vendorId', as: 'payments', onDelete: 'CASCADE' });
Payment.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
Order.hasMany(Payment, { foreignKey: 'orderId', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// Vendor POS / Udhaar / Routes / Notifications / Voice
User.hasMany(Udhaar, { foreignKey: 'vendorId', as: 'udhaars', onDelete: 'CASCADE' });
Udhaar.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });
Customer.hasMany(Udhaar, { foreignKey: 'customerId', as: 'udhaars' });
Udhaar.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

User.hasMany(Route, { foreignKey: 'vendorId', as: 'routes', onDelete: 'CASCADE' });
Route.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(VoiceCommand, { foreignKey: 'vendorId', as: 'voiceCommands', onDelete: 'CASCADE' });
VoiceCommand.belongsTo(User, { foreignKey: 'vendorId', as: 'vendor' });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  Customer,
  Address,
  Cart,
  CartItem,
  Order,
  OrderItem,
  OrderMessage,
  Payment,
  Review,
  SupportTicket,
  Udhaar,
  Route,
  Notification,
  VoiceCommand,
};
