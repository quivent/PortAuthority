from setuptools import setup, find_packages

setup(
    name='portauth-client',
    version='1.0.0',
    description='Port Authority client library for Python',
    py_modules=['portauth'],
    install_requires=[
        'requests>=2.31.0',
    ],
    python_requires='>=3.7',
    keywords='port authority client allocation',
    author='',
    license='MIT',
)
