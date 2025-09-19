USE tarea2;

-- Helpers para evitar repetir NULLs
SET @NULL := NULL;

-- =========================
-- AVISO 1
-- =========================
INSERT INTO aviso_adopcion
(fecha_ingreso, comuna_id, sector, nombre, email, celular, tipo, cantidad, edad, unidad_medida, fecha_entrega, descripcion)
VALUES
    ('2025-08-22 06:00',
     (SELECT id FROM comuna WHERE nombre='Providencia'),
     'Barrio Italia', 'Camila Ruiz', 'camila.ruiz@example.cl', '+569.12345678',
     'gato', 1, 8, 'm', '2025-08-22 09:00', 'Gatita dócil, desparasitada.');
SET @av1 := LAST_INSERT_ID();
INSERT INTO foto (ruta_archivo, nombre_archivo, aviso_id) VALUES
                                                              ('static/uploads','gato3.jpg',@av1),
                                                              ('static/uploads','gato31.jpg',@av1);
INSERT INTO contactar_por (nombre, identificador, aviso_id) VALUES
                                                                ('whatsapp','+56912345678',@av1),
                                                                ('instagram','https://instagram.com/rescates_camila',@av1);

-- =========================
-- AVISO 2
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-22 07:30',
        (SELECT id FROM comuna WHERE nombre='Ñuñoa'),
        'Plaza Ñuñoa','Jorge Salinas','jorge.salinas@example.cl','+569.23456789',
        'perro',2,2,'a','2025-08-22 10:30',@NULL);
SET @av2 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro21.jpeg',@av2);
INSERT INTO contactar_por VALUES (NULL,'telegram','@jorgeRescata',@av2);

-- =========================
-- AVISO 3
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-22 09:00',
        (SELECT id FROM comuna WHERE nombre='Viña del Mar'),
        'Reñaca','Paula Fuentes','paula.fuentes@example.cl','+569.98765432',
        'gato',1,14,'m','2025-08-22 12:15',@NULL);
SET @av3 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','gato52.jpg',@av3);
INSERT INTO contactar_por VALUES
                              (NULL,'X','@paula_adopta',@av3),
                              (NULL,'instagram','https://instagram.com/adopciones_vina',@av3);

-- =========================
-- AVISO 4
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-22 11:15',
        (SELECT id FROM comuna WHERE nombre='Concepcion'),
        'Barrio Universitario','Felipe Mora','felipe.mora@example.cl','+569.11223344',
        'perro',1,3,'a','2025-08-22 15:45','Esterilizado y con chip.');
SET @av4 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro23.jpeg',@av4);

-- =========================
-- AVISO 5
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-22 13:45',
        (SELECT id FROM comuna WHERE nombre='La Serena'),
        'Centro','Daniela Pino','daniela.pino@example.cl',@NULL,
        'gato',3,2,'m','2025-08-22 18:00','Camada rescatada, comen solitos.');
SET @av5 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','gato2.jpg',@av5);
INSERT INTO contactar_por VALUES
                              (NULL,'instagram','@serena_peludos',@av5),
                              (NULL,'tiktok','@rescateLS',@av5);

-- =========================
-- AVISO 6
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-23 06:30',
        (SELECT id FROM comuna WHERE nombre='Maipú'),
        'Ciudad Satélite','Ricardo Gómez','ricardo.gomez@example.cl','+569.55667788',
        'perro',1,7,'a','2025-08-23 11:30','Tranquilo, ideal departamento.');
SET @av6 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro1.jpg',@av6);
INSERT INTO contactar_por VALUES (NULL,'whatsapp','+56955667788',@av6);

-- =========================
-- AVISO 7
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-23 10:00',
        (SELECT id FROM comuna WHERE nombre='Temuco'),
        'Amanecer','Isabel Navarro','isabel.navarro@example.cl','+569.66778899',
        'gato',2,10,'m','2025-08-23 16:20','Muy sociables.');
SET @av7 := LAST_INSERT_ID();
INSERT INTO foto VALUES
                     (NULL,'static/uploads','gato13.jpg',@av7),
                     (NULL,'static/uploads','gato1.jpg',@av7);
INSERT INTO contactar_por VALUES
                              (NULL,'telegram','@isabelRescate',@av7),
                              (NULL,'X','@temuco_mascotas',@av7);

-- =========================
-- AVISO 8
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-23 15:00',
        (SELECT id FROM comuna WHERE nombre='Valparaiso'),
        'Cerro Alegre','Tomás Rivas','tomas.rivas@example.cl','+569.77889900',
        'perro',1,18,'m','2025-08-24 12:00',@NULL);
SET @av8 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro5.jpg',@av8);

-- =========================
-- AVISO 9
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-24 05:45',
        (SELECT id FROM comuna WHERE nombre='Las Condes'),
        'El Golf','María José Araya','maria.araya@example.cl','+569.88990011',
        'gato',1,4,'a','2025-08-24 09:00','Acostumbrado a niños.');
SET @av9 := LAST_INSERT_ID();
-- Nota: la foto que venía es "perro3.jpg" en el dummy, lo respetamos tal cual
INSERT INTO foto VALUES (NULL,'static/uploads','perro3.jpg',@av9);
INSERT INTO contactar_por VALUES (NULL,'instagram','@adoptaLC',@av9);

-- =========================
-- AVISO 10
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-24 08:15',
        (SELECT id FROM comuna WHERE nombre='Talca'),
        'San Miguel','Gonzalo Pérez','gonzalo.perez@example.cl',@NULL,
        'perro',1,6,'m','2025-08-25 07:40','Cachorro con primeras vacunas.');
SET @av10 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro23.jpeg',@av10);
INSERT INTO contactar_por VALUES
                              (NULL,'whatsapp','+56944556677',@av10),
                              (NULL,'tiktok','@mascotasTalca',@av10);

-- =========================
-- AVISO 11
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-24 14:30',
        (SELECT id FROM comuna WHERE nombre='Puerto Montt'),
        'Mirasol','Andrea Soto','andrea.soto@example.cl','+569.99001122',
        'gato',2,5,'m','2025-08-25 18:15','Curiosos y activos.');
SET @av11 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','gato3.jpg',@av11);
INSERT INTO contactar_por VALUES (NULL,'telegram','@andreaPM',@av11);

-- =========================
-- AVISO 12
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-25 06:00',
        (SELECT id FROM comuna WHERE nombre='Antofagasta'),
        'Centro','Marco Vidal','marco.vidal@example.cl','+569.10111213',
        'perro',1,9,'a','2025-08-26 13:20','Se entrega con correa y collar.');
SET @av12 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro5.jpg',@av12);

-- =========================
-- AVISO 13
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-25 10:30',
        (SELECT id FROM comuna WHERE nombre='Santiago'),
        'Barrio Yungay','Valentina Rojas','valentina.rojas@example.cl','+569.11112222',
        'gato',1,11,'m','2025-08-26 17:00','Muy limpio, usa arenero.');
SET @av13 := LAST_INSERT_ID();
-- Foto del dummy es "perro3.jpg", se respeta
INSERT INTO foto VALUES (NULL,'static/uploads','perro3.jpg',@av13);
INSERT INTO contactar_por VALUES
                              (NULL,'X','@valenAdopta',@av13),
                              (NULL,'instagram','https://instagram.com/yungay_peludos',@av13);

-- =========================
-- AVISO 14
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-27 12:45',
        (SELECT id FROM comuna WHERE nombre='Rancagua'),
        'Centro','Sebastián Arancibia','sebastian.arancibia@example.cl',@NULL,
        'perro',3,3,'m','2025-08-27 21:30','Tres cachorros sanos.');
SET @av14 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro1.jpg',@av14);
INSERT INTO contactar_por VALUES (NULL,'whatsapp','+56933445566',@av14);

-- =========================
-- AVISO 15
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-27 00:40',
        (SELECT id FROM comuna WHERE nombre='La Florida'),
        'Trinidad','Carolina Mella','carolina.mella@example.cl','+569.22223333',
        'gato',1,6,'m','2025-08-27 07:40','Cariñoso, se entrega con arena.');
SET @av15 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','gato4.jpg',@av15);
INSERT INTO contactar_por VALUES (NULL,'tiktok','@adoptaLF',@av15);

-- =========================
-- AVISO 16
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-28 07:10',
        (SELECT id FROM comuna WHERE nombre='Quilpue'),
        'El Sol','Natalia Campos','natalia.campos@example.cl','+569.33334444',
        'perro',1,1,'a','2025-08-28 12:10','Sociable con otros perros.');
SET @av16 := LAST_INSERT_ID();
INSERT INTO foto VALUES
                     (NULL,'static/uploads','perro4.jpeg',@av16),
                     (NULL,'static/uploads','perro4.jpg',@av16);
INSERT INTO contactar_por VALUES
                              (NULL,'instagram','@rescate_quilpue',@av16),
                              (NULL,'telegram','@natiQ',@av16);

-- =========================
-- AVISO 17
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-28 08:50',
        (SELECT id FROM comuna WHERE nombre='Talcahuano'),
        'Hualpén','Patricio Mena','patricio.mena@example.cl','+569.44445555',
        'gato',4,2,'m','2025-08-28 20:05','Se entregan con compromiso de esterilización.');
SET @av17 := LAST_INSERT_ID();
INSERT INTO foto VALUES
                     (NULL,'static/uploads','gato5.jpg',@av17),
                     (NULL,'static/uploads','gato51.jpg',@av17);

-- =========================
-- AVISO 18
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-29 10:00',
        (SELECT id FROM comuna WHERE nombre='Calama'),
        '', 'Lorena Torres','lorena.torres@example.cl','+569.55556666',
        'perro',1,8,'m','2025-08-29 13:55',@NULL);
SET @av18 := LAST_INSERT_ID();
INSERT INTO foto VALUES (NULL,'static/uploads','perro1.jpg',@av18);
INSERT INTO contactar_por VALUES
                              (NULL,'whatsapp','+56955556666',@av18),
                              (NULL,'X','@adoptaCalama',@av18);

-- =========================
-- AVISO 19
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-29 10:01',
        (SELECT id FROM comuna WHERE nombre='San Miguel'),
        'El Llano','Matías Correa','matias.correa@example.cl','+569.66667777',
        'gato',1,3,'a','2025-08-29 16:40','Calmado, indoor.');
SET @av19 := LAST_INSERT_ID();
INSERT INTO foto VALUES
                     (NULL,'static/uploads','gato1.jpg',@av19),
                     (NULL,'static/uploads','gato11.jpg',@av19),
                     (NULL,'static/uploads','gato12.jpg',@av19),
                     (NULL,'static/uploads','gato13.jpg',@av19);
INSERT INTO contactar_por VALUES
                              (NULL,'instagram','https://instagram.com/sanmiguel_adopta',@av19),
                              (NULL,'tiktok','@adoptaSM',@av19),
                              (NULL,'telegram','@matias_c',@av19);

-- =========================
-- AVISO 20
-- =========================
INSERT INTO aviso_adopcion
VALUES (NULL,'2025-08-29 06:00',
        (SELECT id FROM comuna WHERE nombre='Osorno'),
        'Rahue','Fernanda Ortiz','fernanda.ortiz@example.cl',@NULL,
        'perro',2,5,'m','2025-08-29 09:35','Dos hermanitos, se entregan juntos o separados.');
SET @av20 := LAST_INSERT_ID();
INSERT INTO foto VALUES
                     (NULL,'static/uploads','perro21.jpeg',@av20),
                     (NULL,'static/uploads','perro22.jpeg',@av20),
                     (NULL,'static/uploads','perro23.jpeg',@av20);
INSERT INTO contactar_por VALUES (NULL,'whatsapp','+56977889900',@av20);
