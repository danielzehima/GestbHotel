-- ============================================================================
-- Ajout de Moov Money à l'enum payment_method
-- ============================================================================

alter type payment_method add value if not exists 'moov_money';
