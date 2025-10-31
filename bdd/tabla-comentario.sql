CREATE TABLE IF NOT EXISTS `tarea2`.`comentario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(80) NOT NULL,
  `texto` VARCHAR(300) NOT NULL,
  `fecha` TIMESTAMP NOT NULL,
  `aviso_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_comentario_aviso1_idx` (`aviso_id` ASC),
  CONSTRAINT `fk_comentario_aviso1`
    FOREIGN KEY (`aviso_id`)
    REFERENCES `tarea2`.`aviso_adopcion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;