FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    && docker-php-ext-install zip

RUN a2enmod rewrite

COPY src/ /var/www/html/

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

CMD ["php", "-S", "0.0.0.0:8000", "-t", "/var/www/html"]