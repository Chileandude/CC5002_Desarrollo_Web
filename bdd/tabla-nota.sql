CREATE TABLE IF NOT EXISTS `tarea2`.`nota` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `aviso_id` INT NOT NULL,
  `nota` INT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_nota_aviso1_idx` (`aviso_id` ASC),
  CONSTRAINT `fk_nota_aviso1`
    FOREIGN KEY (`aviso_id`)
    REFERENCES `tarea2`.`aviso_adopcion` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
