FROM php:8.2-apache

RUN docker-php-ext-install mysqli \
    && a2enmod rewrite actions \
    && echo "AcceptPathInfo On" >> /etc/apache2/apache2.conf

RUN sed -i 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

COPY . /var/www/html/

RUN mkdir -p /var/www/html/uploads \
    && chown -R www-data:www-data /var/www/html \
    && chmod 755 /var/www/html/uploads

EXPOSE 80