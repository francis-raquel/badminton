-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 13, 2025 at 11:52 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `badminton`
--

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` int(11) NOT NULL,
  `court` varchar(11) DEFAULT NULL,
  `userid` int(11) DEFAULT 0,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `court`, `userid`, `date`, `time`) VALUES
(263, 'Court 1', 26, '2025-08-14', '18:00:00'),
(264, 'Court 2', 27, '2025-08-14', '18:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `confirmorder`
--

CREATE TABLE `confirmorder` (
  `userid` int(11) NOT NULL,
  `date` date NOT NULL,
  `name` varchar(1234) NOT NULL,
  `email` varchar(1234) NOT NULL,
  `phone` int(4) NOT NULL,
  `amount` decimal(6,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `confirmorder`
--

INSERT INTO `confirmorder` (`userid`, `date`, `name`, `email`, `phone`, `amount`) VALUES
(0, '2025-08-10', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-10', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-10', 'john', 'john@gmail.com', 2147483647, 40),
(0, '2025-08-10', 'a', 'A@YAHOO.COM', 2147483647, 40),
(0, '2025-08-10', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-10', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-10', 'john', 'john@gmail.com', 2147483647, 40),
(0, '2025-08-10', 'a', 'A@YAHOO.COM', 2147483647, 40),
(0, '2025-08-10', 'a', 'A@YAHOO.COM', 2147483647, 40),
(0, '2025-08-10', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'john', 'john@gmail.com', 2147483647, 40),
(0, '2025-08-12', 'francis', 'francis@yahoo.com', 2147483647, 40),
(0, '2025-08-12', 'a', 'A@YAHOO.COM', 2147483647, 80),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 80),
(0, '2025-08-12', 'peter', 'peter@a.b', 2147483647, 40),
(0, '2025-08-12', 'john', 'john@gmail.com', 2147483647, 40),
(26, '2025-08-13', 'peter', 'peter@a.b', 2147483647, 44),
(27, '2025-08-13', 'john', 'john@gmail.com', 2147483647, 80);

-- --------------------------------------------------------

--
-- Table structure for table `foods`
--

CREATE TABLE `foods` (
  `id` int(5) NOT NULL,
  `type` int(6) NOT NULL,
  `name` varchar(200) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foods`
--

INSERT INTO `foods` (`id`, `type`, `name`, `price`) VALUES
(41, 40, '(SERVICE) Racket Restring', 25.00),
(42, 40, '(SERVICE) Training Beginner', 40.00),
(51, 50, '(BOOKING) Court for Guest & Member Players Only', 40.00),
(52, 50, '(BOOKING) Club Games for Member Players Only', 25.00),
(53, 50, '(BOOKING) Mini Tournament for Member Players Only', 50.00),
(61, 60, '(SHOP) Shoes', 175.00),
(62, 60, '(SHOP) Badminton Bag', 145.00),
(456, 55, 'V Drink', 3.00),
(2343, 38, 'Ice Tea ', 5.50),
(2344, 10, 'Green Tea', 4.10),
(33001, 33, 'Flat White', 6.30),
(33002, 33, 'Latte', 7.60),
(33005, 33, 'Long black', 7.98),
(38001, 38, 'Ceylon Tea', 7.80),
(38002, 38, 'Dimah Green', 6.75),
(78001, 78, 'Mutton Roll', 7.65),
(78002, 78, 'Ulunthu Vadai', 8.75),
(78003, 78, 'Samosa', 7.90),
(99001, 99, 'Pol Arrack', 79.99);

-- --------------------------------------------------------

--
-- Table structure for table `foodtypes`
--

CREATE TABLE `foodtypes` (
  `item no` int(5) NOT NULL,
  `product_services` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `foodtypes`
--

INSERT INTO `foodtypes` (`item no`, `product_services`) VALUES
(10, 'Cold Drinks'),
(20, 'Hot Beverages'),
(30, 'Foods'),
(33, 'Coffee'),
(38, 'Tea'),
(40, 'Services'),
(50, 'Booking'),
(55, 'Energy Drink'),
(60, 'Shop'),
(78, 'Snacks'),
(99, 'Alcohol');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userId` int(5) NOT NULL,
  `username` varchar(55) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(60) NOT NULL,
  `role` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userId`, `username`, `email`, `password`, `role`) VALUES
(25, 'Ganeshan', 'ganeshan8@hotmail.com', '1', 'memberplayer'),
(26, 'Peter', 'peter@a.b', '1', 'memberplayer'),
(27, 'John', 'john@gmail.com', '1', 'guestplayer'),
(28, 'Sue Thompson', 'sue@a.b', '1', ''),
(29, 'Rajesh Khan', 'rajesh@hotmail.com', '1', ''),
(30, 'tariq', 'tariq@yahoo.com', '12', 'ITadmin'),
(31, 'sara', 'sara@fs.co.nz', '12', 'ITadmin'),
(32, 'francis', 'francis@yahoo.com', '1', 'ITadmin'),
(39, 'a', 'A@YAHOO.COM', '1', 'memberplayer'),
(41, 'b', 'b@YAHOO.COM', '1', 'guestplayer');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `foods`
--
ALTER TABLE `foods`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `foodID` (`id`),
  ADD KEY `fk_foodTypeID` (`type`);

--
-- Indexes for table `foodtypes`
--
ALTER TABLE `foodtypes`
  ADD PRIMARY KEY (`item no`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userId`),
  ADD UNIQUE KEY `indexemail` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=265;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userId` int(5) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `foods`
--
ALTER TABLE `foods`
  ADD CONSTRAINT `fk_foodTypeID` FOREIGN KEY (`type`) REFERENCES `foodtypes` (`item no`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
