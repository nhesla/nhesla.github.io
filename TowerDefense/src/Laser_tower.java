import java.awt.*;  


public class Laser_tower extends Tower
{
	public Laser_tower(int x, int y, int d)
	{
		super(x,y,d);
	}
	public Laser_tower(Tower copy, int d)
	{
		super(copy,d);
	}
	
	public int getDamage(int boost)
	{
		switch(damage+boost)
		{
			case 1:
				return 10;
			case 2:
				return 20;
			case 3:
				return 30;
			case 4:
				return 40;
			case 5:
				return 50;
			case 6:
				return 60;
			case 7:
				return 70;
			case 8:
				return 80;
		}
		return 0;
	}
	
	public int getRange(int boost)
	{
		switch(range+boost)
		{
			case 1:
				return 400;
			case 2:
				return 550;
			case 3:
				return 700;
			case 4:
				return 850;
			case 5:
				return 1000;
			case 6:
				return 1150;
			case 7:
				return 1300;
			case 8:
				return 1450;
		}
		return 0;
	}
	
	public int getRate(int boost)
	{
		switch(rate+boost)
		{
			case 1:
				return 50;
			case 2:
				return 47;
			case 3:
				return 44;
			case 4:
				return 41;
			case 5:
				return 38;
			case 6:
				return 35;
			case 7:
				return 32;
			case 8:
				return 29;		
		}
		return 0;
	}
	
	public int getUpD()
	{
		int num=0;
		
		if(damage < 5)
			for(int count=0; count < damage; count ++)
			{
				num += count+1;
			}
		
		return num*400;
	}
	public int getUpR()
	{
		int num=0;
		
		if(range < 5)
			for(int count=0; count < range; count ++)
			{
				num += count+1;
			}
		
		return num*400;
	}
	public int getUpT()
	{
		int num=0;
		
		if(rate < 5)
			for(int count=0; count < rate; count ++)
			{
				num += count+1;
			}
		
		return num*400;
	}
	
	public int getUpS()
	{
		int num=0;
		
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < range; count ++)
		{
			num += count+1;
		}
		for(int count=0; count < rate; count ++)
		{
			num += count+1;
		} 
		
		return num*400/3;
	}
	
	public void Attack(Creep[] creep, int enemies)
	{
		for(int count=0; count < enemies; count ++)
		{
			if(creep[count].getV() && creep[count].getH() > 0)
			{
				double a = creep[count].getX()-getX();
			    double b = creep[count].getY()-getY();
			    double c = Math.hypot(a,b);
				if (c < 1e-6) return; // Prevent near-zero instability

			    	
			    double vector = angle * Math.PI*2 / 360.0;
			    
			    if(c <= (getRange(boostedR)/2)/diviser && reload == 0)
			    {
			    	reload += getRate(boostedT);
			    	target = count;
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    	
			    	b = getX()-targetX;
					a = getY()-targetY;
					c = Math.hypot(a,b);
					if (c < 1e-6) return; // Prevent near-zero instability

			    	
			    	Polygon lazor = new Polygon();
			    	lazor.addPoint((int)((getX()+(35/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)-(35/diviser)*a/c));
			       	lazor.addPoint((int)((getX()+(35/diviser)*-b/c)+(25/diviser)*a/c),(int)((getY()+(25/diviser)*-b/c)-(35/diviser)*a/c));
		       		lazor.addPoint((int)((getX()+(1000/diviser)*-b/c)+(25/diviser)*a/c),(int)((getY()+(25/diviser)*-b/c)-(1000/diviser)*a/c));
		       		lazor.addPoint((int)((getX()+(1000/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)-(1000/diviser)*a/c));
			       	lazor.addPoint((int)((getX()+(35/diviser)*-b/c)-(25/diviser)*a/c),(int)((getY()-(25/diviser)*-b/c)-(35/diviser)*a/c));
		       	
		       		for(int count2=0; count2 < enemies; count2 ++)
		       		{
		       			if(lazor.inside(creep[count2].getX(),creep[count2].getY()))
		       				creep[count2].takeDamage(getDamage(boostedD));
		       		}
			    }
			    
			    if(c <= (getRange(boostedR)/2)/diviser && count == target)
			    {
			    	targetX = creep[count].getX();
			    	targetY = creep[count].getY();
			    	
					if (c > 0) {
						double dx = targetX - getX();
						double dy = targetY - getY();
						angle = (int) Math.toDegrees(Math.atan2(dy, dx));
						if (angle < 0) angle += 360;
					}
					/*
					if(b>0 && c != 0)
			    		angle = (int) Math.toDegrees(Math.asin(a/c));
			    	else if(a>0 && c != 0)
			    		angle = (int) Math.toDegrees(Math.acos(b/c));
			    	else if (b != 0)
			    		angle = (int) Math.toDegrees(Math.atan(a/b));
					/* */
			    }
			}
		}
		
		if(reload > 0)
			reload --;
		else
			target = -1;
	}
	
	public void drawTower(Graphics g)
	{
	  	//Laser turret
	   	double b = getX()-targetX;
		double a = getY()-targetY;
		double c = Math.hypot(a,b);
		
		   	
	   	Polygon part1 = new Polygon();
      	part1.addPoint((int)((getX()+(35/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(35/diviser)*a/c));
       	part1.addPoint((int)((getX()+(35/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(35/diviser)*a/c));
       	part1.addPoint((int)((getX()+(45/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(45/diviser)*a/c));
		part1.addPoint((int)((getX()+(40/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(40/diviser)*a/c));
		part1.addPoint((int)((getX()+(10/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)-(10/diviser)*a/c));
		part1.addPoint((int)((getX()+(5/diviser)*-b/c)+(15/diviser)*a/c),(int)((getY()+(15/diviser)*-b/c)-(5/diviser)*a/c));
		part1.addPoint((int)((getX()-(10/diviser)*-b/c)+(15/diviser)*a/c),(int)((getY()+(15/diviser)*-b/c)+(10/diviser)*a/c));
		part1.addPoint((int)((getX()-(15/diviser)*-b/c)+(10/diviser)*a/c),(int)((getY()+(10/diviser)*-b/c)+(15/diviser)*a/c));
		part1.addPoint((int)((getX()-(15/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)+(15/diviser)*a/c));
		part1.addPoint((int)((getX()-(10/diviser)*-b/c)-(15/diviser)*a/c),(int)((getY()-(15/diviser)*-b/c)+(10/diviser)*a/c));
		part1.addPoint((int)((getX()+(5/diviser)*-b/c)-(15/diviser)*a/c),(int)((getY()-(15/diviser)*-b/c)-(5/diviser)*a/c));
		part1.addPoint((int)((getX()+(10/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(10/diviser)*a/c));
		part1.addPoint((int)((getX()+(40/diviser)*-b/c)-(10/diviser)*a/c),(int)((getY()-(10/diviser)*-b/c)-(40/diviser)*a/c));
		part1.addPoint((int)((getX()+(45/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(45/diviser)*a/c));
		part1.addPoint((int)((getX()+(35/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(35/diviser)*a/c));
				
		g.setColor(Color.magenta);
		g.fillPolygon(part1);
		g.setColor(Color.white);
		g.drawPolygon(part1);
		
		Polygon part2 = new Polygon();
       	part2.addPoint((int)((getX()+(15/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(15/diviser)*a/c));
       	part2.addPoint((int)((getX()+(5/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(5/diviser)*a/c));
		part2.addPoint((int)((getX()+(5/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(5/diviser)*a/c));
		part2.addPoint((int)((getX()+(15/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(15/diviser)*a/c));
		part2.addPoint((int)((getX()+(15/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(15/diviser)*a/c));
				
		g.setColor(Color.gray);
		g.fillPolygon(part2);
		g.setColor(Color.white);
		g.drawPolygon(part2);
				
		Polygon part3 = new Polygon();
       	part3.addPoint((int)((getX()+(30/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(30/diviser)*a/c));
       	part3.addPoint((int)((getX()+(20/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(20/diviser)*a/c));
		part3.addPoint((int)((getX()+(20/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(20/diviser)*a/c));
		part3.addPoint((int)((getX()+(30/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(30/diviser)*a/c));
		part3.addPoint((int)((getX()+(30/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(30/diviser)*a/c));
			
		g.setColor(Color.gray);
		g.fillPolygon(part3);
		g.setColor(Color.white);
		g.drawPolygon(part3);
				
		Polygon part4 = new Polygon();
        part4.addPoint((int)((getX()+(0/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(0/diviser)*a/c));
       	part4.addPoint((int)((getX()-(10/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)+(10/diviser)*a/c));
		part4.addPoint((int)((getX()-(10/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)+(10/diviser)*a/c));
		part4.addPoint((int)((getX()+(0/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(0/diviser)*a/c));
		part4.addPoint((int)((getX()+(0/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(0/diviser)*a/c));
				
		g.setColor(Color.gray);
		g.fillPolygon(part4);
		g.setColor(Color.white);
		g.drawPolygon(part4);
		
		////////laser beam////////////
		if(reload >= getRate(0)-1)
       	{
       		Polygon beam = new Polygon();
	      	beam.addPoint((int)((getX()+(35/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(35/diviser)*a/c));
	       	beam.addPoint((int)((getX()+(35/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(35/diviser)*a/c));
       		beam.addPoint((int)((getX()+(1000/diviser)*-b/c)+(5/diviser)*a/c),(int)((getY()+(5/diviser)*-b/c)-(1000/diviser)*a/c));
       		beam.addPoint((int)((getX()+(1000/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(1000/diviser)*a/c));
	       	beam.addPoint((int)((getX()+(35/diviser)*-b/c)-(5/diviser)*a/c),(int)((getY()-(5/diviser)*-b/c)-(35/diviser)*a/c));
	       	
	       	g.setColor(Color.red);
	       	g.fillPolygon(beam);
	       	
	       
       	}	
	}
}
