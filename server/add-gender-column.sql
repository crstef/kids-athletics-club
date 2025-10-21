-- Adaugă coloana gender la tabelul age_categories
ALTER TABLE age_categories ADD COLUMN IF NOT EXISTS gender VARCHAR(1);

-- Comentariu: M = Masculin (Băieți), F = Feminin (Fete)
