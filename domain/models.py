from passlib.context import CryptContext
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Text,
    String,
    ForeignKey
    )

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy.engine import create_engine

from sqlalchemy.orm import relationship


engine = create_engine("postgresql+psycopg2://postgres:postgres@localhost/redesmultimidiadb")
#conn = engine.connect()
#meta = MetaData()

Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True)
    login = Column(Text, nullable=True)
    senha = Column(Text, nullable=True)
    principals = relationship("Principal", secondary="usuario_principal")

    def add_senha(self, senha):
        #Criando um objeto que usará criptografia do método shs256, rounds default de 80000
        cripto = CryptContext(schemes="sha256_crypt")
        #Encriptografando uma string
        self.senha = cripto.encrypt(senha)

    def validate_senha(self, senha):
         #Criando um objeto que usará criptografia do método shs256, rounds default de 80000
        cripto = CryptContext(schemes="sha256_crypt")
        #Comparando o valor da string com o valor criptografado
        okornot = cripto.verify(senha, self.senha)
        return okornot


class Usuario_profiler(Base):
    __tablename__ = "usuario_profiler"
    id = Column(Integer, primary_key=True)


class Usuario_Principal(Base):
    __tablename__ = "usuario_principal"

    usuario_id = Column(Integer, ForeignKey("usuario.id"), primary_key=True)
    principal_id = Column(Integer, ForeignKey("principal.id"), primary_key=True)


class Principal(Base):
    __tablename__ = "principal"
    id = Column(Integer, primary_key=True)
    nome = Column(Text, nullable=True)
    usuarios = relationship("Usuario", secondary="usuario_principal")
